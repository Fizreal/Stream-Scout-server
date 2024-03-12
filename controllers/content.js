import { getIO } from '../utils/socket.js'

import { Content } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get content', async (data, callback) => {
    const content = await Content.findById(data.id)

    if (typeof callback === 'function') {
      if (content) {
        callback(content)
      } else {
        callback(null)
      }
    }
  })

  socket.on('create content', async (data, redirectCallback, errorCallback) => {
    try {
      const content = new Content(data)
      await content.save()

      if (typeof redirectCallback === 'function') {
        redirectCallback(content._id)
      }
    } catch (error) {
      if (typeof errorCallback === 'function') {
        errorCallback({ error: error.message })
      }
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
          callback(content)
        }
      }
    } catch (error) {
      console.log(error)
    }
  })
}
