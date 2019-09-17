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
    include: [
      AvailableShip,
      Notification,
      {
        model: User,
        include: [Ship, Square],
        order: [
          ["join_date", "ASC"]
        ],
      },
    ],
    order: [
      ["id", "DESC"]
    ],
  })
  return JSON.stringify(data)
}

module.exports = {
  streamRouter,
  streamUpdate,
}