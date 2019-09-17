const Sequelize = require("sequelize")

const { database } = require("../database")
const Ship = require("../ship/model")
const Square = require("../square/model")

const User = database.define("user", {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  games_played: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  games_won: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  must_act: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  join_date: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: 0,
  },
})

User.hasMany(Ship)
User.hasMany(Square)

module.exports = User