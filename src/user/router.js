const { Router } = require("express");
const bcrypt = require("bcrypt");
const User = require("./model");
const { streamUpdate } = require("../stream");

const userRouter = new Router();

userRouter.post("/register", (req, res, next) => {
  User.create({
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, 10)
  })
    .then(user => {
      res.send(user);
      streamUpdate();
    })
    .catch(next);
});

module.exports = userRouter;
