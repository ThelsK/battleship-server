const app = require("express")()
const cors = require("cors")()
const bodyParser = require("body-parser").json()

const userRouter = require("./user")
const authMiddleware = require("./auth")
const roomRouter = require("./room")
const { streamRouter } = require("./stream")

const { databaseSync } = require("./database")
const exampleData = require("./example")

databaseSync().then(exampleData)

app.use(
  cors,
  bodyParser,
  userRouter,
  authMiddleware,
  roomRouter,
  streamRouter,
)

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Listening on :${port}`))
