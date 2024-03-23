// import controllers
import users from './users.js'
import content from './content.js'
import watchlist from './watchlists.js'

export default (socket) => {
  users(socket)
  content(socket)
  watchlist(socket)
}
