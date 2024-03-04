let io

export const init = (ioServer) => {
  io = ioServer
}

export const getIO = () => {
  return io
}
