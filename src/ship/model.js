const Sequelize = require("sequelize")

const { database } = require("../database")

const Ship = database.define("ship", {
  top_pos: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  left_pos: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  length: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 3,
  },
  width: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
})

module.exports = Ship