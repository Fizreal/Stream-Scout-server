import { getIO } from '../utils/socket.js'
import { Profile } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get profile', async (callback) => {
    const profile = await Profile.findOne({ user: socket.user.id })
    callback(profile)
  })

  socket.on('disconnect', () => {
    console.log(`a user disconnected ${socket.id}`)
  })
}
