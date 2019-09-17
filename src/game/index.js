const { Router } = require("express")

const Room = require("../room/model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")
const Square = require("../square/model")
const { streamUpdate } = require("../stream")

const gameRouter = new Router()

gameRouter.post("/startgame", async (req, res) => {
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

    const users = await User.findAll({
      where: { roomId: room.id },
      order: [["join_date", "ASC"]]
    })
    if (user.id !== users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may start the game.`,
      })
    }

    await Notification.create({
      content: `${req.user.username} has started the game.`,
      roomId: room.id,
    })
    await room.update({ status: "placing" })
    for (user in users) {
      await user.update({ must_act: true })
    }
    streamUpdate()
    return res.send({
      success: true,
      message: `Started game in ${room.roomname}.`,
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = gameRouter