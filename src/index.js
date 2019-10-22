const app = require("express")()
const cors = require("cors")()
const bodyParser = require("body-parser").json()

const { streamRouter } = require("./stream")
const userRouter = require("./user")
const authMiddleware = require("./auth")
const roomRouter = require("./room")
const configRouter = require("./game/config")
const gameRouter = require("./game")
const { databaseSync } = require("./database")

app.use(
  cors,
  bodyParser,
  streamRouter,
  userRouter,
  authMiddleware,
  roomRouter,
  configRouter,
  gameRouter,
)

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on :${port}`))

databaseSync()

// ssh -R 80:localhost:4000 serveo.net
