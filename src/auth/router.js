const jwtRouter = new require("express").Router();
const { toJWT } = require("./jwt");
const User = require("../user/model");

jwtRouter.post("/login", (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    res.status(400).send({
      message: "Please supply a valid username and password."
    });
    return;
  }

  User.findOne({ where: { username: req.body.username } })
    .then(entity => {
      if (!entity) {
        res.status(400).send({
          message: "Username not found."
        });
        return;
      }

      if (!require("bcrypt").compareSync(req.body.password, entity.password)) {
        res.status(400).send({
          message: "Incorrect password for that username."
        });
        return;
      }

      res.send({
        jwt: toJWT({ userId: entity.id }),
        userId: entity.id
      });
    })

    .catch(error => {
      console.error(error);
      res.status(500).send({
        message: "An unexpected error occurred.",
        error
      });
    });
});

module.exports = jwtRouter;
