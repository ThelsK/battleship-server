const jwtRouter = new require("express").Router();
const { toJWT } = require("./jwt");
const User = require("../user/model");

module.exports = jwtRouter;
