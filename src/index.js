const app = require("express")()
const cors = require("cors")()
const bodyParser = require("body-parser").json()

const userRouter = require("./user")
const authMiddleware = require("./auth")
const { streamRouter } = require("./stream")
const roomRouter = require("./room")
const gameRouter = require("./game")

const { databaseSync } = require("./database")
const exampleData = require("./example")

app.use(
  cors,
  bodyParser,
  userRouter,
  authMiddleware,
  streamRouter,
  roomRouter,
  gameRouter,
)

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on :${port}`))

databaseSync().then(exampleData)