const app = require("express")()
const cors = require("cors")()
const bodyParser = require("body-parser").json()

const { streamRouter } = require("./stream")
const userRouter = require("./user")
const authMiddleware = require("./auth")
const roomRouter = require("./room")
const gameRouter = require("./game")

const { databaseSync } = require("./database")
const exampleData = require("./example")

app.use(
  cors,
  bodyParser,
  streamRouter,
  userRouter,
  authMiddleware,
  roomRouter,
  gameRouter,
)

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on :${port}`))

databaseSync().then(exampleData)