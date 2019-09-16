const app = require("express")();
const cors = require("cors")();
const bodyParser = require("body-parser").json();

const userRouter = require("./user/router")
const jwtRouter = require("./auth/router")

const { databaseSync } = require("./database");
const streamRouter = require("./stream");
const exampleData = require("./example");

databaseSync().then(exampleData);

app.use(cors, bodyParser, userRouter, jwtRouter, streamRouter);

const port = process.env.PORT || 4000;
app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Listening on :${port}`));
