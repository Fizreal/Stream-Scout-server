import { getIO } from '../utils/socket.js'

import { Profile, Collaborate, Watchlist } from '../models/index.js'
import { formatProfileInformation } from '../utils/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('invite to watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
      const recipient = await Profile.findById(data.recipient)
      const requester = await Profile.findById({ user: socket.user.id })

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
          (owner) => owner.toString() === recipient._id.toString()
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
      const profile = await Profile.findOne({ user: socket.user.id })
      const invitations = await Collaborate.find({
        recipient: profile._id
      })
        .populate({ path: 'requester', model: 'Profile' })
        .populate({ path: 'watchlist', model: 'Watchlist' })

      const formattedInvitations = invitations.map((invitation) => {
        return {
          id: invitation._id,
          watchlist: invitation.watchlist,
          requester: formatProfileInformation(invitation.requester)
        }
      })

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
      const profile = await Profile.findOne({ user: socket.user.id })
      const invitation = await Collaborate.findById(data.invitation)

      if (invitation.recipient.toString() === profile._id.toString()) {
        const watchlist = await Watchlist.findById(invitation.watchlist)
        watchlist.owners.push(profile._id)
        await watchlist.save()
        await invitation.remove()

        if (typeof callback === 'function') {
          callback({ success: true })
        }
        // emit to owners of watchlist
      } else {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Invalid invitation' })
        }
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
      const profile = await Profile.findOne({ user: socket.user.id })
      const invitation = await Collaborate.findById(data.invitation)

      if (invitation.recipient.toString() === profile._id.toString()) {
        await invitation.remove()
        if (typeof callback === 'function') {
          callback({ success: true })
        }
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })
}
