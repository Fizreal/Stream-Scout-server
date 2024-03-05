import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIO } from 'socket.io'
import { init } from './utils/socket.js'
import startSockets from './controllers/startSockets.js'
import jwt from 'jsonwebtoken'
import './db/index.js'
import authRouter from './routes/authentication.js'

const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/auth', authRouter)

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>')
})

io.use((socket, next) => {
  // const token = socket.handshake.auth.token
  const token = socket.handshake.headers.authorization

  jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'))
    }

    socket.user = decoded
    next()
  })
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
