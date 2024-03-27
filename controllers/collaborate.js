import { getIO } from '../utils/socket.js'

import { User, Collaborate, Watchlist } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('invite to watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
      const recipient = await User.findById(data.recipient)
      const requester = await User.findById(socket.user.id)

      if (!watchlist) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Watchlist not found' })
        }
      } else if (!recipient) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Recipient not found' })
        }
      } else if (
        watchlist.owners.find(
          (owner) => String(owner) === String(recipient._id)
        )
      ) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: 'Recipient is already an owner of this watchlist'
          })
        }
      } else {
        await Collaborate.create({
          watchlist: watchlist._id,
          requester: requester._id,
          recipient: recipient._id
        })
        if (typeof callback === 'function') {
          callback({ success: true })
        }
        // send notification to recipient
        // emit to owners of watchlist
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('get invitations', async (callback) => {
    try {
      const invitations = await Collaborate.find({
        recipient: socket.user.id
      }).populate({ path: 'requester', model: 'User' })
      if (typeof callback === 'function') {
        callback(invitations)
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback(null)
      }
    }
  })

  socket.on('accept invitation', async (data, callback) => {
    try {
      const invitation = await Collaborate.findById(data.invitation)
      if (invitation.recipient.toString() === socket.user.id) {
        const watchlist = await Watchlist.findById(invitation.watchlist)
        watchlist.owners.push(socket.user.id)
        await watchlist.save()
        await invitation.remove()
        if (typeof callback === 'function') {
          callback({ success: true })
        }
        // emit to owners of watchlist
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('decline invitation', async (data, callback) => {
    try {
      const invitation = await Collaborate.findById(data.invitation)
      if (invitation.recipient.toString() === socket.user.id) {
        await invitation.remove()
        if (typeof callback === 'function') {
          callback({ success: true })
        }
        // emit to owners of watchlist
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })
}
