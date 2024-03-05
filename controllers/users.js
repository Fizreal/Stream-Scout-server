import { getIO } from '../utils/socket.js'

import { User, Profile } from '../models/index.js'

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

  socket.on('disconnect', () => {
    console.log(`a user disconnected ${socket.id}`)
  })
}
