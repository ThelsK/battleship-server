const { Router } = require("express")

const Room = require("../room/model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")
const Square = require("../square/model")
const { streamUpdate } = require("../stream")
const advance = require("../game/advance")

const configRouter = new Router()

configRouter.post("/maxplayers", async (req, res) => {
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

    if (req.user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may change game settings.`,
      })
    }

    if (!req.body.max_players) {
      return res.status(400).send({
        success: false,
        message: "Please provide a max_players value."
      })
    }

    if (!Number.isInteger(req.body.max_players)) {
      return res.status(400).send({
        success: false,
        message: "The max_players value must be a round number."
      })
    }

    if (req.body.max_players < 2) {
      return res.status(400).send({
        success: false,
        message: "Maximum players cannot be less than 2."
      })
    }

    if (req.body.max_players > 10) {
      return res.status(400).send({
        success: false,
        message: "Maximum players cannot be more than 10."
      })
    }

    if (req.body.max_players === room.max_players) {
      return res.status(400).send({
        success: false,
        message: `Maximum players for room ${room.roomname} \
          is already set to ${room.max_players}.`
      })
    }

    await room.update({ max_players: req.body.max_players })
    streamUpdate()
    return res.send({
      success: true,
      message: `Maximum players for room ${room.roomname} \
        is now set to ${req.body.max_players}.`
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

configRouter.post("/boardheight", async (req, res) => {
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

    if (req.user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may change game settings.`,
      })
    }

    if (!req.body.vert_size) {
      return res.status(400).send({
        success: false,
        message: "Please provide a vert_size value."
      })
    }

    if (!Number.isInteger(req.body.vert_size)) {
      return res.status(400).send({
        success: false,
        message: "The vert_size value must be a round number."
      })
    }

    if (req.body.vert_size < 5) {
      return res.status(400).send({
        success: false,
        message: "Vertical size cannot be less than 5."
      })
    }

    if (req.body.vert_size > 30) {
      return res.status(400).send({
        success: false,
        message: "Vertical size cannot be more than 30."
      })
    }

    if (req.body.vert_size === room.vert_size) {
      return res.status(400).send({
        success: false,
        message: `Vertical size for room ${room.roomname} \
          is already set to ${room.vert_size}.`
      })
    }

    await room.update({ vert_size: req.body.vert_size })
    streamUpdate()
    return res.send({
      success: true,
      message: `Vertical size for room ${room.roomname} \
        is now set to ${req.body.vert_size}.`
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

configRouter.post("/boardwidth", async (req, res) => {
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

    if (req.user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may change game settings.`,
      })
    }

    if (!req.body.hori_size) {
      return res.status(400).send({
        success: false,
        message: "Please provide a hori_size value."
      })
    }

    if (!Number.isInteger(req.body.hori_size)) {
      return res.status(400).send({
        success: false,
        message: "The hori_size value must be a round number."
      })
    }

    if (req.body.hori_size < 5) {
      return res.status(400).send({
        success: false,
        message: "Horizontal size cannot be less than 5."
      })
    }

    if (req.body.hori_size > 30) {
      return res.status(400).send({
        success: false,
        message: "Horizontal size cannot be more than 30."
      })
    }

    if (req.body.hori_size === room.hori_size) {
      return res.status(400).send({
        success: false,
        message: `Horizontal size for room ${room.roomname} \
          is already set to ${room.hori_size}.`
      })
    }

    await room.update({ hori_size: req.body.hori_size })
    streamUpdate()
    return res.send({
      success: true,
      message: `Horizontal size for room ${room.roomname} \
        is now set to ${req.body.hori_size}.`
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

configRouter.post("/addship", async (req, res) => {
  try {

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.user.roomId, {
      include: [AvailableShips, User],
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

    if (req.user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may change game settings.`,
      })
    }

    if (room.available_ships.length >= 12) {
      return res.status(400).send({
        success: false,
        message: "Games cannot have more than 12 ships per player."
      })
    }

    if (!req.body.length || !req.body.width) {
      return res.status(400).send({
        success: false,
        message: "Please provide a length and a width."
      })
    }

    if (!Number.isInteger(req.body.length) ||
      !Number.isInteger(req.body.width)) {
      return res.status(400).send({
        success: false,
        message: "Both length and width must be round numbers."
      })
    }

    if (req.body.length < 1 || req.body.width < 1) {
      return res.status(400).send({
        success: false,
        message: "Both length and width cannot be less than 1."
      })
    }

    if (req.body.length + req.body.width > 6) {
      return res.status(400).send({
        success: false,
        message: "The total of length and width cannot be more than 6."
      })
    }

    await AvailableShip.create({
      length: req.body.length,
      width: req.body.width,
      roomId: room.id
    })
    streamUpdate()
    return res.send({
      success: true,
      message: `Added ship to room ${room.roomname}.`
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

configRouter.post("/removeship", async (req, res) => {
  try {

    if (!req.user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are not in a room.",
      })
    }

    const room = await Room.findByPk(req.user.roomId, {
      include: [AvailableShips, User],
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

    if (req.user.id !== room.users[0].id) {
      return res.status(400).send({
        success: false,
        message: `Only user ${users[0].username} may change game settings.`,
      })
    }

    if (room.available_ships.length <= 1) {
      return res.status(400).send({
        success: false,
        message: "Games cannot have less than 1 ship per player."
      })
    }

    if (!req.body.length || !req.body.width) {
      return res.status(400).send({
        success: false,
        message: "Please provide a length and a width."
      })
    }

    if (!Number.isInteger(req.body.length) ||
      !Number.isInteger(req.body.width)) {
      return res.status(400).send({
        success: false,
        message: "Both length and width must be round numbers."
      })
    }

    if (req.body.length < 1 || req.body.width < 1) {
      return res.status(400).send({
        success: false,
        message: "Both length and width cannot be less than 1."
      })
    }

    if (req.body.length + req.body.width > 6) {
      return res.status(400).send({
        success: false,
        message: "The total of length and width cannot be more than 6."
      })
    }

    const ship = room.available_ships.find(ship =>
      ship.length === req.body.length && ship.width === req.body.width)

    if (!ship) {
      return res.status(400).send({
        success: false,
        message: `No ship found in room ${room.roomname} with length \
          ${req.body.length} and width ${req.body.width}.`
      })
    }

    await AvailableShip.destroy()
    streamUpdate()
    return res.send({
      success: true,
      message: `Removed ship from room ${room.roomname}.`
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = configRouter