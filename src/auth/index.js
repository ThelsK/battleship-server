const { toData } = require("./jwt")
const User = require("../user/model")

const auth = async (req, res, next) => {
  console.log()
  const auth = req.headers.authorization &&
    req.headers.authorization.split(" ")

  if (!auth || auth[0] !== "Bearer" || !auth[1]) {
    return res.status(401).send({
      success: false,
      message: "Please provide a proper authorization token.",
    })
  }

  try {
    const data = toData(auth[1])
    const user = data && await User.findByPk(data.userId)
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Authorization token invalid or expired.",
        user: {
          id: null,
          username: null,
          jwt: null,
        }
      })
    }

    req.user = user
    next()

  } catch (error) {
    console.error(error)
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    })
  }
}

module.exports = auth