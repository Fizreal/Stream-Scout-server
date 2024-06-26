// import controllers
import users from './users.js'
import content from './content.js'
import watchlist from './watchlists.js'
import watched from './watched.js'
import collaborate from './collaborate.js'

export default (socket) => {
  users(socket)
  content(socket)
  watchlist(socket)
  watched(socket)
  collaborate(socket)
}
