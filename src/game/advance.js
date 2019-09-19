const Room = require("../room/model")
const AvailableShip = require("../availableShip/model")
const Notification = require("../notification/model")
const User = require("../user/model")
const Ship = require("../ship/model")

const advance = async roomId => {

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
    await room.users.forEach(async user => {
      await user.update({ must_act: true })
    })
    await Notification.create({
      content: "===== Round 1 =====",
      roomId: room.id,
    })
    return
  }

  if (room.status !== "playing") {
    return
  }

  const survivingUsers = []
  for (usersI = 0; usersI < room.users.length; usersI++) {
    user = room.users[usersI]

    // Eliminate players that have acted and have no unsunk ships.
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
    } else if (!user.eliminated) {
      survivingUsers.push(user)
    }
  }

  // End the game if none or only one survivor remains.
  if (!survivingUsers.length) {
    await room.update({ status: "ended" })
    await Notification.create({
      content: "All players have been eliminated!",
      roomId: room.id,
    })
    return
  }
  if (survivingUsers.length === 1) {
    await room.update({ status: "ended" })
    await survivingUsers[0].update({
      games_played: survivingUsers[0].games_played + 1,
      games_won: survivingUsers[0].games_won + 1,
    })
    await Notification.create({
      content: `${survivingUsers[0].username} is victorious!`,
      roomId: room.id,
    })
    return
  }

  if (room.users.find(user => user.must_act)) {
    return
  }

  await room.users.forEach(async user => {
    if (!user.eliminated) {
      await user.update({ must_act: true })
    }
  })
  await room.update({ round: room.round + 1 })
  await Notification.create({
    content: `===== Round ${room.round} =====`,
    roomId: room.id,
  })
}

module.exports = advance