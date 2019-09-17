const { Router } = require("express")

const Room = require("./model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const { streamUpdate } = require("../stream")

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
    await AvailableShip.create({ length: 5, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 4, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 3, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 3, width: 1, roomId: room.id })
    await AvailableShip.create({ length: 2, width: 1, roomId: room.id })
    await Notification.create({
      content: `${req.user.username} has created the room.`,
      roomId: room.id,
    })
    await req.user.update({
      join_date: new Date().toISOString(),
      roomId: room.id,
    })
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

    const room = await Room.findByPk(req.body.roomId)
    if (!room) {
      return res.status(400).send({
        success: false,
        message: "Room does not exist.",
      })
    }

    const users = await User.findAll({
      where: { roomId: room.id },
      order: [["join_date", "ASC"]]
    })
    if (users.length >= room.max_players) {
      return res.status(400).send({
        success: false,
        message: `Room ${room.roomname} is full.`,
      })
    }

    await Notification.create({
      content: `${req.user.username} has joined the room.`,
      roomId: room.id,
    })
    await req.user.update({
      join_date: new Date().toISOString(),
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

    room = await Room.findByPk(req.user.roomId)
    if (!room) {
      await req.user.update({ roomId: null })
      streamUpdate()

      return res.status(400).send({
        success: false,
        message: "Room does not exist.",
      })
    }

    await Notification.create({
      content: `${req.user.username} has left the room.`,
      roomId: room.id,
    })
    await req.user.update({ roomId: null })
    // =================================================================
    // ========== If the room is empty, it must be destroyed! ==========
    // =================================================================
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