import { getIO } from '../utils/socket.js'

import { User, Profile, Friend } from '../models/index.js'
import { get } from 'mongoose'

export default (socket) => {
  const io = getIO()

  const getProfile = async (id) => {
    const profile = await Profile.findOne({ user: id }).populate({
      path: 'friends',
      populate: {
        path: 'recipient',
        model: 'User'
      }
    })

    return profile
  }
  socket.emit('connected', getProfile(socket.user.id))

  socket.on('get profile', async (callback) => {
    const profile = await getProfile(socket.user.id)

    if (typeof callback === 'function') {
      callback(profile)
    }
  })

  socket.on('get all profiles', async (callback) => {
    const profiles = await Profile.find({ user: { $ne: socket.user.id } })
    if (typeof callback === 'function') {
      callback(profiles)
    }
  })

  socket.on('check username', async (data, callback) => {
    const profile = await Profile.findOne({ username: data.username })
    let unique = profile ? false : true

    if (typeof callback === 'function') {
      callback(unique)
    }
  })

  socket.on('update profile', async (data, callback) => {
    let profile = await Profile.findOne({ user: socket.user.id })

    if (profile) {
      profile.country = data.country
      profile.subscriptions = data.subscriptions
      profile.username = data.username
      await profile.save()
    } else {
      const user = await User.findById(socket.user.id)
      profile = await Profile.create({
        user: user._id,
        country: data.country,
        subscriptions: data.subscriptions,
        friends: [],
        username: data.username
      })
    }

    if (typeof callback === 'function') {
      callback(profile)
    }
  })

  socket.on('add friend', async (data, callback) => {
    const userProfile = await Profile.findOne({ user: socket.user.id })
    const requestedProfile = await Profile.findOne({ user: data.id })

    if (!(userProfile && requestedProfile)) return

    const friendA = await Friend.create({
      requester: userProfile._id,
      recipient: requestedProfile._id,
      status: 2
    })
    const friendB = await Friend.create({
      requester: requestedProfile._id,
      recipient: userProfile._id,
      status: 1
    })

    userProfile.friends.push(friendA._id)
    await userProfile.save()

    requestedProfile.friends.push(friendB._id)
    await requestedProfile.save()

    //callback
    io.to(requestedProfile.user).emit('friend request', { friendB })
  })

  socket.on('accept friend', async (data, callback) => {
    const userProfile = await Profile.findOne({ user: socket.user.id })
    const requestedProfile = await Profile.findOne({ user: data.id })

    if (!(userProfile && requestedProfile)) return

    const friendA = await Friend.findOneAndUpdate(
      {
        requester: userProfile._id,
        recipient: requestedProfile._id
      },
      { status: 3 }
    )
    await friendA.save()

    const friendB = await Friend.findOneAndUpdate(
      {
        requester: requestedProfile._id,
        recipient: userProfile._id
      },
      { status: 3 }
    )
    await friendB.save()

    //callback

    io.to(requestedProfile.user).emit('request accepted', { friendB })
  })

  socket.on('reject friend', async (data, callback) => {
    const userProfile = await Profile.findOne({ user: socket.user.id })
    const requestedProfile = await Profile.findOne({ user: data.id })

    if (!(userProfile && requestedProfile)) return

    const friendA = await Friend.findOneAndRemove({
      requester: userProfile._id,
      recipient: requestedProfile._id
    })

    const friendB = await Friend.findOneAndRemove({
      requester: requestedProfile._id,
      recipient: userProfile._id
    })

    //callback

    io.to(requestedProfile.user).emit('request accepted', { userProfile })
  })

  socket.on('disconnect', () => {
    console.log(`a user disconnected ${socket.id}`)
  })
}
