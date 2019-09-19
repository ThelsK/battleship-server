const Room = require("../room/model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")

const advance = async roomId => {
  console.log("Room ID:", roomId)

  const room = await Room.findByPk(roomId, {
    include: [{ model: User, include: [Ship] }],
    order: [[User, "join_date", "ASC"]],
  })

  // If all players have left, delete the game.
  if (!room.users.length) {
    await Room.destroy({ where: { id: room.id } })
    Notification.destroy({ where: { roomId: room.id } })
    AvailableShip.destroy({ where: { roomId: room.id } })
    return
  }

  if (room.status === "placing") {

    // If a single player remains while placing ships, end the game.
    if (room.users.length === 1) {
      await room.update({ status: "ended" })
      await Notification.create({
        content: "Not enough players remain. Game has ended.",
        roomId: room.id,
      })
      return
    }

    if (room.users.find(user => user.must_act)) {
      return
    }

    // Advance to the first round.
    await room.update({ status: "playing", round: 1 })
    room.users.forEach(async user => {
      await user.update({ must_act: true })
    })
    await Notification.create({
      content: "===== Round 1 =====",
      roomId: room.id,
    })
  }

  if (room.status !== "playing") {
    return
  }

  // Eliminate players that have acted and have no unsunk ships.
  room.users.forEach(async user => {
    if (!user.eliminated && !user.must_act &&
      !user.ships.find(ship => !ship.sunk)) {
      await user.update({
        eliminated: true,
        games_played: user.games_played + 1,
      })
      await Notification.create({
        content: `${user.username} has been eliminated!`,
        roomId: room.id,
      })
    }
  })

  // End the game if none or only one survivor remains.
  const survivingUsers = room.users.filter(user => !user.eliminated)
  if (!survivingUsers.length) {
    await room.update({ status: "ended" })
    await Notification.create({
      content: "All players are eliminated.",
      roomId: room.id,
    })
  }
  if (survivingUsers.length === 1) {
    await room.update({ status: "ended" })
    await survivingUsers[0].update({
      games_played: user.games_played + 1,
      games_won: survivingUsers[0].games_won + 1,
    })
    await Notification.create({
      content: `${survivingUsers[0].username} is victorious!`,
      roomId: room.id,
    })
  }

  if (room.users.find(user => user.must_act)) {
    return
  }

  // Advance to the next round.
  await room.update({ round: room.round + 1 })
  room.users.forEach(async user => {
    if (!user.eliminated) {
      await User.update({ must_act: true })
    }
  })
  await Notification.create({
    content: `===== Round ${room.round + 1} =====`,
    roomId: room.id,
  })
}

module.exports = advance