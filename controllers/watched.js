import { getIO } from '../utils/socket.js'

import { Watched, Content, Profile } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('add to watched', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id })
      const content = await Content.findById(data.content)
      const watched = await Watched.create({
        content: content._id,
        liked: data.liked,
        mood: data.mood
      })
      profile.watched.push(watched._id)
      await profile.save()
      if (typeof callback === 'function') {
        callback(watched)
      }
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('update watched', async (data, callback) => {
    try {
      const watched = await Watched.findById(data.watched)
      watched.liked = data.liked
      watched.mood = data.mood
      await watched.save()
      if (typeof callback === 'function') {
        callback(watched)
      }
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('remove from watched', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id })
      profile.watched = profile.watched.filter(
        (watched) => String(watched) !== data.watched
      )
      await profile.save()
      await Watched.findByIdAndDelete(data.watched)
      if (typeof callback === 'function') {
        callback(data.watched)
      }
    } catch (error) {
      console.log(error)
    }
  })
}
