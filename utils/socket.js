let io

let socketToUser = {}

export const init = (ioServer) => {
  io = ioServer
}

export const getIO = () => {
  return io
}

export const addSocket = (userId, socket) => {
  if (socketToUser[userId]) {
    socketToUser[userId].disconnect()
  } else {
    socketToUser[userId] = socket
  }
}

export const getSocket = (userId) => {
  return socketToUser[userId]
}

export const removeSocket = (userId) => {
  delete socketToUser[userId]
}
