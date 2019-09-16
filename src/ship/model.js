const Sequelize = require("sequelize");
const database = require("../database");

const Ship = database.define("ship", {
  top_pos: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  left_pos: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  direction: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "vert"
  },
  length: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  width: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
});

module.exports = Ship;
