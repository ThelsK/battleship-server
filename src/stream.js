const Sse = require("json-sse")
const { Router } = require("express")

const Room = require("./room/model")
const AvailableShip = require("./availableShip/model")
const Notification = require("./notification/model")
const User = require("./user/model")
const Ship = require("./ship/model")
const Square = require("./square/model")

const stream = new Sse()
const streamRouter = new Router()

streamRouter.get("/stream", async (req, res) => {
  data = await streamData()
  stream.updateInit(data)
  return stream.init(req, res)
})

const streamUpdate = async () => {
  data = await streamData()
  stream.send(data)
}

const streamData = async () => {
  data = await Room.findAll({
    attributes: ["id", "roomname", "status", "round",
      "hori_size", "vert_size", "max_players"],
    include: [
      {
        model: AvailableShip,
        attributes: ["length", "width"],
      },
      {
        model: Notification,
        attributes: ["content"],
      },
      {
        model: User,
        attributes: ["username", "eliminated", "must_act"],
        include: [
          {
            model: Ship,
            attributes: ["length", "width", "top_pos", "left_pos", "sunk"],
          },
          {
            model: Square,
            attributes: ["status", "hori_pos", "vert_pos"],
          },
        ],
      },
    ],
    order: [
      ["id", "DESC"],
      [AvailableShip, "id", "ASC"],
      [Notification, "id", "ASC"],
      [User, "join_date", "ASC"],
    ],
  })
  return JSON.stringify(data)
}

module.exports = {
  streamRouter,
  streamUpdate,
}