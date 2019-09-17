const Sequelize = require("sequelize")

const { database } = require("../database")

const Square = database.define("square", {
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "fog",
  },
  hori_pos: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  vert_pos: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
})

module.exports = Square