import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIO } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new SocketIO(server)

app.use(cors())

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>')
})

io.on('connection', (socket) => {
  console.log('We are live and connected')
  console.log(socket.id)
})

server.listen(3000, () => {
  console.log('listening on *:3000')
})
