const Sequelize = require("sequelize")

const { database } = require("../database")

const AvailableShip = database.define("available_ship", {
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

module.exports = AvailableShip