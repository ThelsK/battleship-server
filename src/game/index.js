const { Router } = require("express")

const Room = require("../room/model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")
const Square = require("../square/model")
const { streamUpdate } = require("../stream")
const advance = require("../game/advance")

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
    await room.users.forEach(async user =>
      await user.update({ must_act: true })
    )
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
    console.log("Receiving data:", req.body.ships)

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.user.roomId, {
      include: [AvailableShip, User],
      order: [
        [AvailableShip, "id", "ASC"],
        [User, "join_date", "ASC"],
      ],
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

    console.log("Room:", room)

    if (!req.body.ships) {
      return res.status(400).send({
        success: false,
        message: "Please provide data for ships."
      })
    }

    const placedShips = []
    req.body.ships.forEach(ship => {
      if (!ship.length || !ship.width) {
        return res.status(400).send({
          success: false,
          message: "Please provide a length and a width for each ship."
        })
      }

      let available_shipsIndex = -1
      for (let i = 0; i < room.available_ships.length; i++) {
        if ((ship.length === room.available_ships[i].length &&
          ship.width === room.available_ships[i].width) ||
          (ship.length === room.available_ships[i].width &&
            ship.width === room.available_ships[i].length)) {
          available_shipsIndex = i
        }
      }
      if (available_shipsIndex === -1 && ship.length <= ship.width) {
        return res.status(400).send({
          success: false,
          message: `Too many ships with length ${ship.length} \
            and width ${ship.width}.`
        })
      }
      if (available_shipsIndex === -1) {
        return res.status(400).send({
          success: false,
          message: `Too many ships with length ${ship.width} \
            and width ${ship.length}.`
        })
      }
      room.available_ships.splice(available_shipsIndex, 1)

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

      placedShips.forEach(placedShip => {
        if (ship.top_pos + ship.length >= placedShip.top_pos &&
          placedShip.top_pos + placedShip.length >= ship.top_pos &&
          ship.left_pos + ship.width >= placedShip.left_pos &&
          placedShip.left_pos + placedShip.width >= ship.top_pos) {
          return res.status(400).send({
            success: false,
            message: "Ships may not overlap or be adjacent to each other."
          })
        }
      })

      // Add to placed ships, so later ships cannot overlap.
      placedShips.push(ship)
    })

    if (room.available_ships.length) {
      return res.status(400).send({
        success: false,
        message: `Not enough ships with length \
          ${room.available_ships[0].length} and width \
          ${room.available_ships[0].width}.`.trim()
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

    await advance(room.id)
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