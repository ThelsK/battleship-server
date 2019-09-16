const Sequelize = require("sequelize");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://postgres:secret@localhost:5432/postgres";
const database = new Sequelize(databaseUrl);

const databaseSync = () =>
  database
    .sync({ force: false })
    .then(() => {
      console.log("Database initialized successfully");
    })
    .catch(err => {
      console.error("Unable to initialize database:", err);
      process.exit(1);
    });

module.exports = { database, databaseSync };
