const { Router } = require("express");
const Sse = require("json-sse");

const Room = require("./room/model");
const AvailableShip = require("./availableShip/model");
const Notification = require("./notification/model");
const User = require("./user/model");
const Ship = require("./ship/model");
const Square = require("./square/model");

const router = new Router();
const stream = new Sse();

router.get("/stream", (req, res) => {
  Room.findAll({
    include: [
      AvailableShip,
      Notification,
      {
        model: User,
        include: [Ship, Square]
      }
    ]
  }).then(rooms => {
    stream.updateInit(JSON.stringify(rooms));
    return stream.init(req, res);
  });
});

module.exports = router;
