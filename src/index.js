const app = require("express")();
const cors = require("cors")();
const bodyParser = require("body-parser").json();
const Sse = require("json-sse");

const Room = require("./room/model");
const AvailableShip = require("./availableShip/model");
const Notification = require("./notification/model");
const User = require("./user/model");
const Ship = require("./ship/model");
const Square = require("./square/model");
const { databaseSync } = require("./database");
const stream = new Sse();

app.use(cors, bodyParser);
app.get("/stream", (req, res) => {
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

const port = process.env.PORT || 4000;
app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Listening on :${port}`));

const exampleData = () => {
  Room.findOrCreate({
    where: { roomname: "Fruit" }
  });
  Room.findOrCreate({
    where: { roomname: "Veggies" }
  });
  Room.findOrCreate({
    where: { roomname: "Meat" }
  });
  Room.findOrCreate({
    where: { roomname: "Fish" }
  });
  AvailableShip.findOrCreate({
    where: { length: 4 },
    defaults: {
      roomId: 1
    }
  });
  Notification.findOrCreate({
    where: { content: "Hello World!" },
    defaults: {
      roomId: 1
    }
  });
  User.findOrCreate({
    where: { username: "Apple" },
    defaults: {
      password: "XXX",
      roomId: 1
    }
  });
  User.findOrCreate({
    where: { username: "Banana" },
    defaults: {
      password: "XXX",
      roomId: 1
    }
  });
  Ship.findOrCreate({
    where: { top_pos: 2 },
    defaults: {
      userId: 1,
      left_pos: 4,
      direction: "vert",
      length: 4
    }
  });
  Square.findOrCreate({
    where: { hori_pos: 3 },
    defaults: {
      userId: 1,
      status: "hit",
      vert_pos: 5
    }
  });
};

databaseSync().then(exampleData);
