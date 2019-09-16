const Sequelize = require("sequelize");
const { database } = require("../database");
const User = require("../user/model");
const AvailableShip = require("../availableShip/model");
const Notification = require("../notification/model");

const Room = database.define("room", {
  roomname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "open"
  },
  round: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  hori_size: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  vert_size: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  max_players: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 2
  }
});

Room.hasMany(User);
Room.hasMany(AvailableShip);
Room.hasMany(Notification);

module.exports = Room;
