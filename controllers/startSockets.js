// import controllers
import users from './users.js'
import content from './content.js'

export default (socket) => {
  users(socket)
  content(socket)
}
