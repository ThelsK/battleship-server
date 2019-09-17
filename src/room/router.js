const { Router } = require("express");
const Room = require("./model");
const User = require("../user/model");
const { streamUpdate } = require("../stream");

const roomRouter = new Router();

roomRouter.post("/createroom", async (req, res, next) => {
  try {
    user = await User.findByPk(req.user.id);
    if (user.roomId) {
      return res.status(400).send({
        success: false,
        message: "You are already in a room."
      });
    }

    room = await Room.create({ roomname: req.body.roomname });
    await user.update({ roomId: room.id });

    streamUpdate();
    return res.send({
      success: true,
      message: "Room created and joined."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
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
