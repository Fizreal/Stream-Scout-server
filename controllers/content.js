import { getIO } from '../utils/socket.js'

import { Content, Watched } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get content', async (data, callback) => {
    try {
      const content = await Content.findOne({ _id: data.id })
      const watchedRecords = await Watched.find({ content: content._id })
      // calculate most common moods and % liked

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
        const containsCountry = content.streamingInfo.find(
          (stream) => stream.country === data.streamingInfo[0].country
        )

        if (!containsCountry) {
          content.streamingInfo.push(data.streamingInfo[0])
          await content.save()
        }

        callback({ success: true, content: content })
      } else {
        delete data._id
        const newContent = new Content(data)
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

      const watched = await Watched.findOne({
        content: content._id,
        user: socket.request.user._id
      })

      if (!watched) {
        watched = new Watched({
          content: content._id,
          liked: true,
          disliked: false,
          mood: '',
          user: socket.request.user._id
        })
      } else {
        watched.liked = true
        watched.disliked = false
      }

      content.likes += 1
      await content.save()
      await watched.save()

      if (typeof callback === 'function') {
        callback({ success: true, content: content })
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

      const watched = await Watched.findOne({
        content: content._id,
        user: socket.request.user._id
      })

      if (!watched) {
        watched = new Watched({
          content: content._id,
          liked: false,
          disliked: true,
          mood: '',
          user: socket.request.user._id
        })
      } else {
        watched.liked = false
        watched.disliked = true
      }

      content.dislikes += 1
      await content.save()
      await watched.save()

      if (typeof callback === 'function') {
        callback({ success: true, content: content })
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

      const watched = await Watched.findOne({
        content: content._id,
        user: socket.request.user._id
      })

      if (!watched) {
        throw new Error('Watched record not found')
      }

      watched.liked = false
      content.likes -= 1
      await content.save()
      await watched.save()

      if (typeof callback === 'function') {
        callback({ success: true, content: content })
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

      const watched = await Watched.findOne({
        content: content._id,
        user: socket.request.user._id
      })

      if (!watched) {
        throw new Error('Watched record not found')
      }

      watched.disliked = false
      content.dislikes -= 1
      await content.save()
      await watched.save()

      if (typeof callback === 'function') {
        callback({ success: true, content: content })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })
}
