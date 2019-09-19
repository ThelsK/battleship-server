const { Router } = require("express")

const Room = require("./model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")
const Square = require("../square/model")
const { streamUpdate } = require("../stream")
const advance = require("../game/advance")

const roomRouter = new Router()

roomRouter.post("/createroom", async (req, res) => {
  try {

    if (req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are already in a room.",
      })
    }

    const room = await Room.create({ roomname: req.body.roomname })
    await req.user.update({
      join_date: new Date().toISOString(),
      roomId: room.id,
      eliminated: false,
      must_act: false,
    })
    await Notification.create({
      content: `${req.user.username} has created the room.`,
      roomId: room.id,
    })
    await AvailableShip.create({ length: 5, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 4, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 3, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 3, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 2, width: 1, roomId: room.id })
    streamUpdate()
    return res.send({
      success: true,
      message: `Created and joined room ${room.roomname}.`,
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

roomRouter.post("/joinroom", async (req, res) => {
  try {

    if (req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are already in a room.",
      })
    }

    const room = await Room.findByPk(req.body.roomId, {
      include: [User],
      order: [[User, "join_date", "ASC"]],
    })
    if (!room) {
      return res.status(400).send({
        success: false,
        message: "Room does not exist.",
      })
    }

    if (room.status !== "open") {
      return res.status(400).send({
        success: false,
        message: `Game in room ${room.roomname} has already started.`,
      })
    }

    if (room.users.length >= room.max_players) {
      return res.status(400).send({
        success: false,
        message: `Room ${room.roomname} is full.`,
      })
    }

    await req.user.update({
      join_date: new Date().toISOString(),
      roomId: room.id,
      eliminated: false,
      must_act: false,
    })
    await Notification.create({
      content: `${req.user.username} has joined the room.`,
      roomId: room.id,
    })
    streamUpdate()
    return res.send({
      success: true,
      message: `Joined room ${room.roomname}.`,
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

roomRouter.post("/leaveroom", async (req, res) => {
  try {

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.user.roomId, {
      include: [User],
      order: [[User, "join_date", "ASC"]],
    })

    // Always delete User's room data, even if room does not exist.
    await req.user.update({ roomId: null })
    Ship.destroy({ where: { userId: req.user.id } })
    Square.destroy({ where: { userId: req.user.id } })

    if (!room) {
      streamUpdate()
      return res.status(400).send({
        success: false,
        message: "Room does not exist.",
      })
    }

    // If the user is not yet eliminated, add a loss.
    if (room.status === "playing" && !req.user.eliminated) {
      await req.user.update({ games_played: req.user.games_played + 1 })
    }

    await Notification.create({
      content: `${req.user.username} has left the room.`,
      roomId: room.id,
    })

    await advance(room.id)
    streamUpdate()
    return res.send({
      success: true,
      message: `Left room ${room.roomname}.`,
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = roomRouter