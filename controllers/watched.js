import { getIO } from '../utils/socket.js'

import { Watched, Content, Profile } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('add to watched', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id }).populate({
        path: 'watched',
        model: 'Watched'
      })
      const content = await Content.findById(data.contentId)

      const checkWatched = profile.watched.find((watched) => {
        return watched.content.toString() === content._id.toString()
      })

      if (checkWatched) {
        if (typeof callback === 'function') {
          callback({ success: true, error: 'Content already watched' })
        }
        return
      }

      const watched = await Watched.create({
        content: content._id,
        liked: false,
        disliked: false,
        mood: ''
      })
      profile.watched.push(watched._id)
      await profile.save()

      const updatedProfile = await Profile.findOne({ user: socket.user.id })
        .populate({
          path: 'friends',
          populate: {
            path: 'recipient',
            model: 'User'
          }
        })
        .populate({
          path: 'watched',
          populate: {
            path: 'content',
            model: 'Content'
          }
        })

      if (typeof callback === 'function') {
        callback({ success: true, profile: updatedProfile })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  // ice box future feature
  socket.on('update watched tags', async (data, callback) => {
    try {
      const watched = await Watched.findById(data.watched)
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
        .populate({
          path: 'friends',
          populate: {
            path: 'recipient',
            model: 'User'
          }
        })
        .populate({
          path: 'watched',
          populate: {
            path: 'content',
            model: 'Content'
          }
        })

      profile.watched = profile.watched.filter(
        (watched) => watched._id.toString() !== data.watchedId
      )
      await profile.save()
      await Watched.findByIdAndDelete(data.watchedId)

      if (typeof callback === 'function') {
        callback({ success: true, profile: profile })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })
}
