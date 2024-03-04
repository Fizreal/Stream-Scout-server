import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIO } from 'socket.io'
import { init } from './utils/socket.js'
import startSockets from './controllers/startSockets.js'
import './db/index.js'

const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)

app.use(cors())

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>')
})

if (io) {
  init(io)
  io.on('connect', (socket) => {
    startSockets(socket)
  })
}

server.listen(3000, () => {
  console.log('listening on *:3000')
})
