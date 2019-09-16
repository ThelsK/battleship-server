const Sequelize = require("sequelize");
const database = require("../database");
const Square = require("../square/model")
const Ship = require("../ship/model")

const User = database.define("user", {
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  games_played: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  games_won: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  must_act: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

User.hasMany(Square)
User.hasMany(Ship)

module.exports = User