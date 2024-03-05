import { getIO } from '../utils/socket.js'

import { User, Profile, Friend } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get profile', async (callback) => {
    const profile = await Profile.findOne({ user: socket.user.id }).populate({
      path: 'friends',
      populate: {
        path: 'recipient',
        model: 'User'
      }
    })
    if (typeof callback === 'function') {
      callback(profile)
    }
  })

  socket.on('check username', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ username: data.username })
      let response = profile ? false : true

      if (typeof callback === 'function') {
        callback({ unique: response })
      }
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('update profile', async (data, callback) => {
    let profile = await Profile.findOne({ user: socket.user.id })
    try {
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
    } catch (error) {
      console.log(error)
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
  })

  socket.on('disconnect', () => {
    console.log(`a user disconnected ${socket.id}`)
  })
}
