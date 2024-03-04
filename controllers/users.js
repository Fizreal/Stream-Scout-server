import { getIO } from '../utils/socket.js'

export default (socket) => {
  const io = getIO()

  console.log(`a user connected ${socket.id}`)
  socket.on('disconnect', () => {
    console.log(`a user disconnected ${socket.id}`)
  })
}
