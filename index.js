import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIO } from 'socket.io'
import { init, addSocket } from './utils/socket.js'
import startSockets from './controllers/startSockets.js'
import jwt from 'jsonwebtoken'
import './db/index.js'
import authRouter from './routes/authentication.js'

const app = express()
const server = http.createServer(app)
const io = new SocketIO(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/auth', authRouter)

app.get('/', (req, res) => {
  res.send('<h1>Server</h1>')
})

io.use((socket, next) => {
  const token = socket.handshake.auth.token

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
    addSocket(socket.user.id, socket)
    startSockets(socket)
  })
}

server.listen(3001, () => {
  console.log('listening on *:3001')
})
