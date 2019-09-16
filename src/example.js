const Room = require("./room/model");
const AvailableShip = require("./availableShip/model");
const Notification = require("./notification/model");
const User = require("./user/model");
const Ship = require("./ship/model");
const Square = require("./square/model");

const exampleData = () => {
  Room.findOrCreate({
    where: { roomname: "Fruit" }
  }).then(() => {
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
    }).then(() => {
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
    });
    User.findOrCreate({
      where: { username: "Banana" },
      defaults: {
        password: "XXX",
        roomId: 1
      }
    });
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
};

module.exports = exampleData;
