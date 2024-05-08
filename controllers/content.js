import { getIO } from '../utils/socket.js'

import { Content, Profile, Watched } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get content', async (data, callback) => {
    try {
      const content = await Content.findOne({ _id: data.id })

      // calculate most common moods
      // const watchedRecords = await Watched.find({ content: content._id })

      if (typeof callback === 'function') {
        callback(content)
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback(null)
      }
    }
  })

  socket.on('create content', async (data, callback) => {
    try {
      const content = await Content.findOne({
        tmdbId: data.tmdbId,
        type: data.type
      })
      if (content) {
        const containsCountry = data.streamingInfo.length
          ? content.streamingInfo.find(
              (stream) => stream.country === data.streamingInfo[0].country
            )
          : true

        if (!containsCountry) {
          content.streamingInfo.push(data.streamingInfo[0])
          await content.save()
        }

        callback({ success: true, content: content })
      } else {
        delete data._id
        const newContent = new Content(data)
        console.log(newContent)
        await newContent.save()
        callback({ success: true, content: newContent })
      }
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })

  socket.on('update availability', async (data, callback) => {
    try {
      const content = await Content.findById(data.id)
      if (content) {
        content.streamingInfo = data.streamingInfo
        content.streamingValidated = {
          lastUpdated: new Date(),
          validated: true
        }
        await content.save()

        if (typeof callback === 'function') {
          callback({ success: true, content: content })
        }
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('like content', async (data, callback) => {
    try {
      const content = await Content.findById(data.id)

      if (!content) {
        throw new Error('Content not found')
      }

      const profile = await Profile.findOne({
        user: socket.user.id
      }).populate('watched')

      let watchedExists = profile.watched.find(
        (watched) => watched.content.toString() === content._id.toString()
      )

      if (watchedExists) {
        const watched = await Watched.findById(watchedExists._id)
        if (watched.disliked) {
          watched.disliked = false
          content.dislikes -= 1
        }
        if (!watched.liked) {
          content.likes += 1
          watched.liked = true
        }
        await watched.save()
      } else {
        const watched = await Watched.create({
          content: content._id,
          liked: true,
          disliked: false,
          mood: ''
        })
        profile.watched.push(watched._id)
        await profile.save()
        content.likes += 1
      }

      await content.save()

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
        callback({ success: true, content: content, profile: updatedProfile })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('dislike content', async (data, callback) => {
    try {
      const content = await Content.findById(data.id)

      if (!content) {
        throw new Error('Content not found')
      }

      const profile = await Profile.findOne({
        user: socket.user.id
      }).populate('watched')

      let watchedExists = profile.watched.find(
        (watched) => watched.content.toString() === content._id.toString()
      )

      if (watchedExists) {
        const watched = await Watched.findById(watchedExists._id)
        if (watched.liked) {
          content.likes -= 1
          watched.liked = false
        }
        if (!watched.disliked) {
          watched.disliked = true
          content.dislikes += 1
        }
        await watched.save()
      } else {
        const watched = await Watched.create({
          content: content._id,
          liked: false,
          disliked: true,
          mood: ''
        })
        profile.watched.push(watched._id)
        await profile.save()
        content.dislikes += 1
      }

      await content.save()

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
        callback({ success: true, content: content, profile: updatedProfile })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('unlike content', async (data, callback) => {
    try {
      const content = await Content.findById(data.id)

      if (!content) {
        throw new Error('Content not found')
      }

      const profile = await Profile.findOne({
        user: socket.user.id
      }).populate('watched')

      let watchedExists = profile.watched.find(
        (watched) => watched.content.toString() === content._id.toString()
      )

      if (watchedExists) {
        const watched = await Watched.findById(watchedExists._id)
        if (watched.liked) {
          content.likes -= 1
          watched.liked = false
        }
        await watched.save()
        await content.save()
      }

      const updatedProfile = await Profile.findOne({
        user: socket.user.id
      })
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
        callback({ success: true, content: content, profile: updatedProfile })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('undislike content', async (data, callback) => {
    try {
      const content = await Content.findById(data.id)

      if (!content) {
        throw new Error('Content not found')
      }

      const profile = await Profile.findOne({
        user: socket.user.id
      }).populate('watched')

      let watchedExists = profile.watched.find(
        (watched) => watched.content.toString() === content._id.toString()
      )

      if (watchedExists) {
        const watched = await Watched.findById(watchedExists._id)
        if (watched.disliked) {
          content.dislikes -= 1
          watched.disliked = false
        }
        await watched.save()
        await content.save()
      }

      const updatedProfile = await Profile.findOne({
        user: socket.user.id
      })
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
        callback({ success: true, content: content, profile: updatedProfile })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })
}
