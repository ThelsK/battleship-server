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

    if (room.status !== "open") {
      return res.status(400).send({
        success: false,
        message: `The game in room ${room.roomname} has already started.`,
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

    if (room.status === "open") {
      return res.status(400).send({
        success: false,
        message: `The game in room ${room.roomname} \
          has not yet started.`,
      })
    }

    if (room.status !== "placing") {
      return res.status(400).send({
        success: false,
        message: `The ships in room ${room.roomname} \
          have already been placed.`,
      })
    }

    if (!req.user.must_act) {
      return res.status(400).send({
        success: false,
        message: "You have already placed your ships.",
      })
    }

    if (!req.body.ships || !Array.isArray(req.body.ships)) {
      return res.status(400).send({
        success: false,
        message: "Please provide data for ships as an array."
      })
    }

    const placedShips = []
    for (let shipI = 0; shipI < req.body.ships.length; shipI++) {
      const ship = req.body.ships[shipI]

      if (!ship.length || !ship.width) {
        return res.status(400).send({
          success: false,
          message: "Please provide a length and a width for each ship."
        })
      }

      if (!Number.isInteger(ship.length) || !Number.isInteger(ship.width)) {
        return res.status(400).send({
          success: false,
          message: "Both length and width must be round numbers."
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

      if (ship.top_pos === undefined || ship.top_pos === null ||
        ship.left_pos === undefined || ship.left_pos === null) {
        return res.status(400).send({
          success: false,
          message: `Please provide a top_pos \
            and a left_pos for each ship.`
        })
      }

      if (!Number.isInteger(ship.top_pos) ||
        !Number.isInteger(ship.left_pos)) {
        return res.status(400).send({
          success: false,
          message: "Both top_pos and left_pos must be round numbers."
        })
      }

      if (ship.top_pos < 0 ||
        ship.top_pos + ship.length > room.vert_size) {
        return res.status(400).send({
          success: false,
          message: "Ships may not run off the top or bottom of the map."
        })
      }

      if (ship.left_pos < 0 ||
        ship.left_pos + ship.width > room.hori_size) {
        return res.status(400).send({
          success: false,
          message: "Ships may not run off either side of the map."
        })
      }

      if (placedShips.find(compare =>
        compare.top_pos <= ship.top_pos + ship.length &&
        compare.top_pos + compare.length >= ship.top_pos &&
        compare.left_pos <= ship.left_pos + ship.width &&
        compare.left_pos + compare.width >= ship.left_pos)) {
        return res.status(400).send({
          success: false,
          message: "Ships may not overlap or be adjacent to each other."
        })
      }

      // Add to placed ships, so later ships cannot overlap.
      placedShips.push(ship)
    }

    if (room.available_ships.length) {
      return res.status(400).send({
        success: false,
        message: `Not enough ships with length \
          ${room.available_ships[0].length} and width \
          ${room.available_ships[0].width}.`.trim()
      })
    }

    await req.user.update({ must_act: false })
    req.body.ships.forEach(async ship => {
      await Ship.create({
        top_pos: ship.top_pos,
        left_pos: ship.left_pos,
        height: ship.height,
        width: ship.width,
        sunk: false,
        userId: req.user.id,
      })
    })
    await Notification.create({
      content: `${req.user.username} has placed their ships.`,
      roomId: room.id,
    })

    await advance(room.id)
    streamUpdate()
    return res.send({
      success: true,
      message: `Ships placed in room ${room.roomname}.`,
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

gameRouter.post("/placeattack", async (req, res) => {
  try {

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.user.roomId, {
      include: [{ model: User, include: [Ship, Square] }],
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

    if (room.status === "open") {
      return res.status(400).send({
        success: false,
        message: `The game in room ${room.roomname} \
          has not yet started.`,
      })
    }

    if (room.status === "placing") {
      return res.status(400).send({
        success: false,
        message: `The ships in room ${room.roomname} \
          must still be placed.`,
      })
    }

    if (room.status === "ended") {
      return res.status(400).send({
        success: false,
        message: `The game in room ${room.roomname} \
          has already ended.`,
      })
    }

    if (!req.user.must_act) {
      return res.status(400).send({
        success: false,
        message: `You have already attacked during round ${room.round}.`,
      })
    }

    if (!req.body.hori_pos || !req.body.vert_pos) {
      return res.status(400).send({
        success: false,
        message: "Please provide a vert_pos and a hori_pos."
      })
    }

    if (!req.body.hori_pos.isInteger() ||
      !req.body.vert_pos.isInteger()) {
      return res.status(400).send({
        success: false,
        message: "Both vert_pos and hori_pos must be round numbers."
      })
    }

    if (req.body.vert_pos < 0 || req.body.vert_pos >= room.vert_size) {
      return res.status(400).send({
        success: false,
        message: `The value of vert_pos must be between 0 and \
          ${room.vert_size - 1} (inclusive).`
      })
    }

    if (req.body.hori_pos < 0 || req.body.hori_pos >= room.hori_size) {
      return res.status(400).send({
        success: false,
        message: `The value of hori_pos must be between 0 and \
          ${room.hori_size - 1} (inclusive).`
      })
    }

    const targetUsers = room.users.filter(user =>
      user.id !== req.user.id && !user.eliminated &&
      !user.squares.find(square =>
        square.vert_pos === req.body.vert_pos &&
        square.hori_pos === req.body.hori_pos))

    if (!targetUsers.length) {
      return res.status(400).send({
        success: false,
        message: "Target position is already attacked for all opponents."
      })
    }

    await req.user.update({ must_act: false })
    await Notification.create({
      content: `${req.user.username} attacks column \
        ${req.body.vert_pos + 1} row ${req.body.hori_pos + 1} ...`,
      roomId: room.id,
    })

    targetUsers.forEach(async user => {
      const targetShip = user.ships.find(ship =>
        ship.vert_pos <= req.body.vert_pos &&
        ship.vert_pos + ship.length > req.body.vert_pos &&
        ship.hori_pos <= req.body.hori_pos &&
        ship.hori_pos + ship.width > req.body.hori_pos)

      if (!targetShip) {
        await Square.create({
          vert_pos: req.body.vert_pos,
          hori_pos: req.body.hori_pos,
          status: "miss",
          userId: targetUsers.id,
        })
        await Notification.create({
          content: `... and misses the ship of ${user.username}.`,
          roomId: room.id,
        })
        return
      }

      await Square.create({
        vert_pos: req.body.vert_pos,
        hori_pos: req.body.hori_pos,
        status: "hit",
        userId: targetUsers.id,
      })

      let sunk = true
      for (let x = 0; x < targetShip.length; x++) {
        for (let y = 0; y < targetShip.width; y++) {
          if (!user.squares.find(square =>
            square.vert_pos === targetShip.top_pos + x &&
            square.hori_pos === targetShip.left_pos + y)) {
            sunk = false
          }
        }
      }

      if (!sunk) {
        await Notification.create({
          content: `... and hits a ship of ${user.username}.`,
          roomId: room.id,
        })
        return
      }
      await Notification.create({
        content: `... and sinks a ship of ${user.username}.`,
        roomId: room.id,
      })

      for (let x = 0; x < targetShip.length; x++) {
        for (let y = 0; y < targetShip.width; y++) {
          await user.squares.find(square =>
            square.vert_pos === targetShip.top_pos + x &&
            square.hori_pos === targetShip.left_pos + y)
            .update({ status: "sunk" })
        }
      }

      for (let x = -1; x <= targetShip.length; x++) {
        for (let y = -1; y <= targetShip.width; y++) {
          if (targetShip.top_pos + x >= 0 &&
            targetShip.top_pos + x < room.hori_size &&
            targetShip.left_pos + y >= 0 &&
            targetShip.left_pos + y < room.vert_size &&
            !user.squares.find(square =>
              square.vert_pos === targetShip.top_pos + x &&
              square.hori_pos === targetShip.left_pos + y)) {

            await Square.create({
              vert_pos: req.body.vert_pos,
              hori_pos: req.body.hori_pos,
              status: "miss",
              userId: targetUsers.id,
            })
          }
        }
      }
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