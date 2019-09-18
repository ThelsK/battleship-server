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

    const room = await Room.findByPk(req.user.roomId, {
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

    if (room.users.length < 2) {
      return res.status(400).send({
        success: false,
        message: "At least 2 players are required to play.",
      })
    }

    if (req.user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may start the game.`,
      })
    }

    await room.update({ status: "placing" })
    for (roomUser in room.users) {
      console.log("RoomUser:", roomUser)
      await roomUser.update({ must_act: true })
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

gameRouter.post("/placeships", async (req, res) => {
  try {

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.body.roomId, {
      include: [AvailableShip, User],
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

    if (!req.body.ships) {
      return res.status(400).send({
        success: false,
        message: "Please provide data for ships."
      })
    }

    const placedShips = []
    for (ship in req.body.ships) {
      if (!ship.length || !ship.width) {
        return res.status(400).send({
          success: false,
          message: "Please provide a length and a width for each ship."
        })
      }

      let availableShipsIndex = -1
      for (let i = 0; i < room.availableShips.length; i++) {
        if ((ship.length === room.availableShips[i].length &&
          ship.width === room.availableShips[i].width) ||
          (ship.length === room.availableShips[i].width &&
            ship.width === room.availableShips[i].length)) {
          availableShipsIndex = i
        }
      }
      if (availableShipsIndex === -1 && ship.length <= ship.width) {
        return res.status(400).send({
          success: false,
          message: `Too many ships with length ${ship.length} \
            and width ${ship.width}.`
        })
      }
      if (availableShipsIndex === -1) {
        return res.status(400).send({
          success: false,
          message: `Too many ships with length ${ship.width} \
            and width ${ship.length}.`
        })
      }
      room.availableShips.splice(availableShipsIndex, 1)

      if (!ship.top_pos || !ship.left_pos) {
        return res.status(400).send({
          success: false,
          message: "Please provide a top_pos and a left_pos for each ship."
        })
      }

      if (ship.top_pos + ship.length > room.vert_size) {
        return res.status(400).send({
          success: false,
          message: "Ships may not run off the bottom of the map."
        })
      }

      if (ship.left_pos + ship.width > room.hori_size) {
        return res.status(400).send({
          success: false,
          message: "Ships may not run off the right side of the map."
        })
      }

      for (placedShip in placedShips) {
        if (ship.top_pos + ship.length >= placedShip.top_pos &&
          placedShip.top_pos + placedShip.length >= ship.top_pos &&
          ship.left_pos + ship.width >= placedShip.left_pos &&
          placedShip.left_pos + placedShip.width >= ship.top_pos) {
          return res.status(400).send({
            success: false,
            message: "Ships may not overlap or be adjacent to each other."
          })
        }
      }

      // Add to placed ships, so later ships cannot overlap.
      placedShips.push(ship)
    }

    if (room.availableShips.length) {
      return res.status(400).send({
        success: false,
        message: `Not enough ships with length \
          ${room.availableShips[0].length} and width \
          ${room.availableShips[0].width}.`.trim()
      })
    }

    await req.user.update({ must_act: false })
    for (ship in req.body.ships) {
      await Ship.create({
        top_pos: ship.top_pos,
        left_pos: ship.left_pos,
        height: ship.height,
        width: ship.width,
        sunk: false,
        userId: req.user.id,
      })
    }
    await Notification.create({
      content: `${req.user.username} has placed their ships.`,
      roomId: room.id,
    })

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
        await roomUser.update({ must_act: true })
      }
      await Notification.create({
        content: "===== Round 1 =====",
        roomId: room.id,
      })
    }

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

gameRouter.post("/placeships", async (req, res) => {
  try {

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.body.roomId, {
      include: [AvailableShip, User],
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

    if (!req.body.ships) {
      return res.status(400).send({
        success: false,
        message: "Please provide data for ships."
      })
    }

    const placedShips = []
    for (ship in req.body.ships) {
      if (!ship.length || !ship.width) {
        return res.status(400).send({
          success: false,
          message: "Please provide a length and a width for each ship."
        })
      }

      let availableShipsIndex = -1
      for (let i = 0; i < room.availableShips.length; i++) {
        if ((ship.length === room.availableShips[i].length &&
          ship.width === room.availableShips[i].width) ||
          (ship.length === room.availableShips[i].width &&
            ship.width === room.availableShips[i].length)) {
          availableShipsIndex = i
        }
      }
      if (availableShipsIndex === -1 && ship.length <= ship.width) {
        return res.status(400).send({
          success: false,
          message: `Too many ships with length ${ship.length} \
            and width ${ship.width}.`
        })
      }
      if (availableShipsIndex === -1) {
        return res.status(400).send({
          success: false,
          message: `Too many ships with length ${ship.width} \
            and width ${ship.length}.`
        })
      }
      room.availableShips.splice(availableShipsIndex, 1)

      if (!ship.top_pos || !ship.left_pos) {
        return res.status(400).send({
          success: false,
          message: "Please provide a top_pos and a left_pos for each ship."
        })
      }

      if (ship.top_pos + ship.length > room.vert_size) {
        return res.status(400).send({
          success: false,
          message: "Ships may not run off the bottom of the map."
        })
      }

      if (ship.left_pos + ship.width > room.hori_size) {
        return res.status(400).send({
          success: false,
          message: "Ships may not run off the right side of the map."
        })
      }

      for (placedShip in placedShips) {
        if (ship.top_pos + ship.length >= placedShip.top_pos &&
          placedShip.top_pos + placedShip.length >= ship.top_pos &&
          ship.left_pos + ship.width >= placedShip.left_pos &&
          placedShip.left_pos + placedShip.width >= ship.top_pos) {
          return res.status(400).send({
            success: false,
            message: "Ships may not overlap or be adjacent to each other."
          })
        }
      }

      // Add to placed ships, so later ships cannot overlap.
      placedShips.push(ship)
    }

    if (room.availableShips.length) {
      return res.status(400).send({
        success: false,
        message: `Not enough ships with length \
          ${room.availableShips[0].length} and width \
          ${room.availableShips[0].width}.`.trim()
      })
    }

    await req.user.update({ must_act: false })
    for (ship in req.body.ships) {
      await Ship.create({
        top_pos: ship.top_pos,
        left_pos: ship.left_pos,
        height: ship.height,
        width: ship.width,
        sunk: false,
        userId: req.user.id,
      })
    }
    await Notification.create({
      content: `${req.user.username} has placed their ships.`,
      roomId: room.id,
    })

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
        await roomUser.update({ must_act: true })
      }
      await Notification.create({
        content: "===== Round 1 =====",
        roomId: room.id,
      })
    }

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

const advanceGame = roomId => {

}

module.exports = gameRouter