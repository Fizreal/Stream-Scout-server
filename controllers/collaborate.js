import { getIO, getSocket } from '../utils/socket.js'

import { Profile, Collaborate, Watchlist } from '../models/index.js'
import { formatProfileInformation } from '../utils/index.js'

export default (socket) => {
  const io = getIO()

  const getInvitations = async (userId) => {
    const profile = await Profile.findOne({ user: userId })
    if (!profile) return []

    const invitations = await Collaborate.find({ recipient: profile._id })
      .populate({ path: 'requester', model: 'Profile' })
      .populate({
        path: 'watchlist',
        populate: {
          path: 'owners',
          model: 'Profile'
        }
      })

    if (!invitations) return []

    const formattedInvitations = invitations.map((invitation) => {
      const formattedOwners = invitation.watchlist.owners.map((owner) => {
        return formatProfileInformation(owner)
      })

      const formattedWatchlist = {
        ...invitation.watchlist._doc,
        owners: formattedOwners
      }

      return {
        _id: invitation._id,
        watchlist: formattedWatchlist,
        requester: formatProfileInformation(invitation.requester)
      }
    })

    return formattedInvitations
  }

  const getUpdatedWatchlist = async (watchlistId) => {
    const watchlist = await Watchlist.findById(watchlistId)
      .populate({ path: 'owners', model: 'Profile' })
      .populate({ path: 'list.content', model: 'Content' })

    if (!watchlist) return null

    return {
      _id: watchlist._id,
      owners: watchlist.owners.map((owner) => formatProfileInformation(owner)),
      name: watchlist.name,
      list: watchlist.list
    }
  }

  socket.on('invite to watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
      const requester = await Profile.findById({ user: socket.user.id })

      if (!watchlist) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Watchlist not found' })
        }
      }

      data.recipients.forEach(async (recipient) => {
        const recipientProfile = await Profile.findById(recipient)
        if (!recipientProfile) {
          return
        }

        const existingInvitation = await Collaborate.findOne({
          watchlist: watchlist._id,
          recipient: recipientProfile._id
        })

        if (existingInvitation) return

        const collaboration = new Collaborate({
          watchlist: watchlist._id,
          requester: requester._id,
          recipient: recipientProfile._id
        })

        await collaboration.save()

        const recipientSocket = getSocket(recipientProfile.user.toString())
        if (recipientSocket) {
          const invitations = await getInvitations(recipientProfile.user)
          recipientSocket.emit('update invitations', {
            invitations: invitations
          })
        }
      })

      if (typeof callback === 'function') {
        callback({ success: true })
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
      const invitations = await getInvitations(socket.user.id)

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

      if (!invitation) {
        throw new Error('Invitation not found')
      }

      if (invitation.recipient.toString() === profile._id.toString()) {
        const watchlist = await Watchlist.findById(invitation.watchlist)
        watchlist.owners.push(profile._id)
        await watchlist.save()
        await invitation.remove()

        if (typeof callback === 'function') {
          callback({ success: true })
        }

        const updatedWatchlist = await getUpdatedWatchlist(watchlist._id)

        if (updatedWatchlist) {
          updatedWatchlist.owners.forEach(async (owner) => {
            const ownerSocket = getSocket(owner.user.toString())
            if (ownerSocket) {
              ownerSocket.emit('update watchlist', {
                watchlist: updatedWatchlist
              })
            }
          })
        }
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

      if (!invitation) {
        throw new Error('Invitation not found')
      }

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
