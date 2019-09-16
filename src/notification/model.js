const Sequelize = require("sequelize");
const database = require("../database");

const Notification = database.define("notification", {
  content: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = Notification;
