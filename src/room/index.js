const { Router } = require("express")

const Room = require("./model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")
const Square = require("../square/model")
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

    await Notification.create({
      content: `${req.user.username} has left the room.`,
      roomId: room.id,
    })

    // If User was the only User, destroy the room.
    if (room.users.length === 1) {
      await Room.destroy({ where: { id: room.id } })
      Notification.destroy({ where: { roomId: room.id } })
      AvailableShip.destroy({ where: { roomId: room.id } })

    } else if (room.status === "placing") {
      // If only one additional User remains, end the game.
      if (room.users.length === 2) {
        await room.update({ status: "ended" })
        await Notification.create({
          content: "Not enough players remain. Ending game.",
          roomId: room.id,
        })

      } else {
        // Check to see if all users have placed their ships.
        const activeUsers = []
        for (roomUser in room.users) {
          if (roomUser.id !== user.id && roomUser.must_act) {
            activeUsers.push(roomUser)
          }
        }

        // If all users have placed their ships, start the game.
        if (!activeUsers.length) {
          await room.update({ status: "playing", round: 1 })
          for (roomUser in room.users) {
            if (roomUser.id !== user.id) {
              await roomUser.update({ must_act: true })
            }
          }
          await Notification.create({
            content: "===== Round 1 =====",
            roomId: room.id,
          })
        }
      }

    } else if (room.status === "playing") {

      // If the user is not yet eliminated, add a loss.
      if (!req.user.eliminated) {
        await req.user.update({ games_played: req.user.games_played + 1 })
      }

      // Check to see how many players still remain in the game.
      const remainingUsers = []
      const activeUsers = []

      for (roomUser in room.users) {
        if (roomUser.id !== user.id && !roomUser.eliminated) {
          remainingUsers.push(roomUser)
        }
        if (roomUser.id !== user.id && roomUser.must_act) {
          activeUsers.push(roomUser)
        }
      }

      // If only a single user is not eliminated, they win.
      if (remainingUsers.length === 1) {
        await remainingUsers[0].update({
          games_played: remainingUsers[0].games_played + 1,
          games_won: remainingUsers[0].games_won + 1,
        })
        await room.update({ status: "ended" })
        await Notification.create({
          content: `${remainingUsers[0].username} is victorious!`,
          roomId: room.id,
        })

        // If no users remain to act, advance to the next round.
      } else if (!activeUsers.length) {
        await room.update({ round: room.round + 1 })
        for (roomUser in room.users) {
          if (roomUser.id !== user.id && !roomUser.eliminated) {
            await roomUser.update({ must_act: true })
          }
        }
        await Notification.create({
          content: `===== Round ${room.round + 1} =====`,
          roomId: room.id,
        })
      }
    }

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