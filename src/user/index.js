const { Router } = require("express")
const Sequelize = require("sequelize")
const bcrypt = require("bcrypt")

const { toJWT } = require("../auth/jwt")
const User = require("./model")

const userRouter = new Router()

userRouter.post("/register", async (req, res) => {
  try {
    console.log("Register body:", req.body)

    if (!req.body.username || !req.body.username.trim()) {
      return res.status(400).send({
        success: false,
        message: "Please provide a username.",
      })
    }

    if (!req.body.password || !req.body.password.trim()) {
      return res.status(400).send({
        success: false,
        message: "Please provide a password.",
      })
    }

    if (!req.body.passwordCopy || !req.body.passwordCopy.trim()) {
      return res.status(400).send({
        success: false,
        message: "Please provide a copy of the password.",
      })
    }

    if (req.body.password.trim().toLowerCase() !==
      req.body.passwordCopy.trim().toLowerCase()) {

      return res.status(400).send({
        success: false,
        message: "The password and the copy are not identical.",
      })
    }

    if (req.body.username.trim().toLowerCase() ===
      req.body.password.trim().toLowerCase()) {

      return res.status(400).send({
        success: false,
        message: "Username and password cannot be identical.",
      })
    }

    const checkUser = await User.findOne({
      where: {
        username: {
          [Sequelize.Op.iLike]: req.body.username.trim()
        }
      },
    })
    if (checkUser) {
      return res.status(400).send({
        success: false,
        message: `Username ${checkUser.username} already exists.`,
      })
    }

    const user = await User.create({
      username: req.body.username.trim(),
      password: bcrypt.hashSync(req.body.password.trim().toLowerCase(), 10)
    })
    return res.send({
      success: true,
      message: `Registered user ${user.username}.`,
      user: {
        username: user.username,
        jwt: toJWT({ userId: user.id }),
      }
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

userRouter.post("/login", async (req, res) => {
  try {

    if (!req.body.username || !req.body.username.trim()) {
      return res.status(400).send({
        success: false,
        message: "Please provide a username.",
      })
    }

    if (!req.body.password || !req.body.password.trim()) {
      return res.status(400).send({
        success: false,
        message: "Please provide a password.",
      })
    }

    const user = await User.findOne({
      where: {
        username: {
          [Sequelize.Op.iLike]: req.body.username.trim()
        }
      },
    })
    if (!user) {
      return res.status(400).send({
        success: false,
        message: `Username ${req.body.username.trim()} not found.`,
      })
    }

    if (!bcrypt.compareSync(
      req.body.password.trim().toLowerCase(), user.password)) {

      res.status(400).send({
        success: false,
        message: `Incorrect password for user ${user.username}.`,
      })
      return
    }

    return res.send({
      success: true,
      message: `Logged in as user ${user.username}.`,
      user: {
        username: user.username,
        jwt: toJWT({ userId: user.id }),
      }
    })

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = userRouter