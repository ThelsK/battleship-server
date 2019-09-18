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

    const room = await Room.findByPk(req.body.roomId, {
      include: [User],
      order: [[User, "join_date", "ASC"]],
    })
    if (!room) {
      await req.user.update({ roomId: null })
      Ship.destroy({ where: { userId: req.user.id } })
      Square.destroy({ where: { userId: req.user.id } })
      streamUpdate()

      return res.status(400).send({
        success: false,
        message: "Room does not exist.",
      })
    }

    // if (room.users.length < 2) {
    //   return res.status(400).send({
    //     success: false,
    //     message: "At least 2 players are required to play.",
    //   })
    // }

    if (user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may start the game.`,
      })
    }

    await room.update({ status: "placing" })
    for (user in room.users) {
      await user.update({ must_act: true })
    }
    await Notification.create({
      content: `${req.user.username} has started the game.`,
      roomId: room.id,
    })
    streamUpdate()
    return res.send({
      success: true,
      message: `Started game in room ${room.roomname}.`,
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