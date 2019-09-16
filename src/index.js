const app = require("express")()
const cors = require("cors")()
const bodyParser = require("body-parser").json()

const User = require("./user/model")
const Room = require("./room/model")

app.use(
  cors,
  bodyParser,
)

const port = process.env.PORT || 4000
app.get("/", (req, res) => res.send("Hello World!"))
app.listen(port, () => console.log(`Listening on :${port}`))