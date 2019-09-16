const app = require("express")();
const cors = require("cors")();
const bodyParser = require("body-parser").json();

const userRouter = require("./user/router");
const jwtRouter = require("./auth/router");
const authMiddleware = require("./auth/middleware");
const roomRouter = require("./room/router");
const { streamRouter } = require("./stream");

const { databaseSync } = require("./database");
const exampleData = require("./example");

app.use(
  cors,
  bodyParser,
  userRouter,
  jwtRouter,
  authMiddleware,
  roomRouter,
  streamRouter
);

const port = process.env.PORT || 4000;
app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Listening on :${port}`));

databaseSync().then(exampleData);
