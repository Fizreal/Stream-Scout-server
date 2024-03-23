import { getIO } from '../utils/socket.js'

import { Content } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get content', async (data, callback) => {
    try {
      const content = await Content.findOne({ _id: data.id })
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
}
