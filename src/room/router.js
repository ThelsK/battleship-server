const { Router } = require("express");
const Room = require("./model");
const User = require("../user/model");
const { streamUpdate } = require("../stream");

const roomRouter = new Router();

roomRouter.post("/createroom", (req, res, next) => {
  Room.create({ roomname: req.body.roomname })
    .then(room => {
      User.findByPk(req.user.id).then(user => {
        user.update({ roomId: room.id }).then(user => {
          streamUpdate();
          res.send(user);
        });
      });
    })
    .catch(next);
});

// roomRouter.post("/joinroom", (req, res, next) => {
//   User.create({
//     username: req.body.username,
//     password: bcrypt.hashSync(req.body.password, 10)
//   })
//     .then(user => {
//       res.send(user);
//       streamUpdate();
//     })
//     .catch(next);
// });

// roomRouter.post("/leaveroom", (req, res, next) => {
//   User.create({
//     username: req.body.username,
//     password: bcrypt.hashSync(req.body.password, 10)
//   })
//     .then(user => {
//       res.send(user);
//       streamUpdate();
//     })
//     .catch(next);
// });

module.exports = roomRouter;
