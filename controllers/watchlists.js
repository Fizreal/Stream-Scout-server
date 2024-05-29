import { getIO, getSocket } from '../utils/socket.js'
import { Watchlist, Content, Collaborate, Profile } from '../models/index.js'
import { formatProfileInformation } from '../utils/index.js'

export default (socket) => {
  const io = getIO()

  const getUserWatchlists = async (userId) => {
    try {
      const profile = await Profile.findOne({ user: userId })

      const watchlists = await Watchlist.find({
        owners: { $in: [profile._id] }
      })
        .populate({ path: 'owners', model: 'Profile' })
        .populate({ path: 'list.content', model: 'Content' })

      const formattedWatchlists = watchlists.map((watchlist) => {
        return {
          _id: watchlist._id,
          owners: watchlist.owners.map((owner) =>
            formatProfileInformation(owner)
          ),
          name: watchlist.name,
          list: watchlist.list
        }
      })

      return formattedWatchlists
    } catch (error) {
      console.log(error)
      return []
    }
  }

  const getUpdatedWatchlist = async (watchlistId) => {
    const watchlist = await Watchlist.findById(watchlistId)
      .populate({ path: 'owners', model: 'Profile' })
      .populate({ path: 'list.content', model: 'Content' })

    if (!watchlist) return null

    return {
      private: watchlist,
      public: {
        _id: watchlist._id,
        owners: watchlist.owners.map((owner) =>
          formatProfileInformation(owner)
        ),
        name: watchlist.name,
        list: watchlist.list
      }
    }
  }

  socket.on('get watchlists', async (callback) => {
    try {
      const watchlists = await getUserWatchlists(socket.user.id)
      if (typeof callback === 'function') {
        callback({ watchlists })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback(null)
      }
    }
  })

  socket.on('create watchlist', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id })

      const watchlist = await Watchlist.create({
        owners: [profile._id],
        name: data.name,
        list: []
      })

      if (data.content) {
        const content = await Content.findById(data.content)
        watchlist.list.push({
          content: content._id,
          order: 1
        })
      }
      await watchlist.save()

      const updatedWatchlists = await getUserWatchlists(socket.user.id)

      if (typeof callback === 'function') {
        callback({ success: true, watchlists: updatedWatchlists })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })

  socket.on('add to watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
      const content = await Content.findById(data.content)

      const order = watchlist.list.length ? watchlist.list.length + 1 : 1

      watchlist.list.push({
        content: content._id,
        order: order
      })
      await watchlist.save()

      if (typeof callback === 'function') {
        callback({ success: true })
      }

      const updatedWatchlist = await getUpdatedWatchlist(watchlist._id)

      if (updatedWatchlist) {
        updatedWatchlist.private.owners.forEach((owner) => {
          const ownerSocket = getSocket(owner.user.toString())
          if (ownerSocket) {
            console.log
            ownerSocket.emit('update watchlist', {
              watchlist: updatedWatchlist.public
            })
          }
        })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })

  // requires implementation
  socket.on('remove from watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)

      const removedContentPosition = watchlist.list.find(
        (listItem) => listItem.content.toString() === data.content
      )

      if (!removedContentPosition) {
        throw new Error('Content not found in watchlist')
      }

      watchlist.list = watchlist.list.filter(
        (listItem) => listItem.content.toString() !== data.content
      )

      watchlist.list.forEach((listItem) => {
        if (listItem.order > removedContentPosition.order) {
          listItem.order--
        }
      })

      await watchlist.save()

      if (typeof callback === 'function') {
        callback({ success: true })
      }

      const updatedWatchlist = await getUpdatedWatchlist(watchlist._id)

      if (updatedWatchlist) {
        updatedWatchlist.private.owners.forEach((owner) => {
          const ownerSocket = getSocket(owner.user.toString())
          if (ownerSocket) {
            ownerSocket.emit('update watchlist', {
              watchlist: updatedWatchlist.public
            })
          }
        })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })

  socket.on('leave watchlist', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id })
      const watchlist = await Watchlist.findById(data.watchlist)

      if (!watchlist) {
        throw new Error('Watchlist not found')
      }

      const updatedOwners = watchlist.owners.filter((owner) => {
        return owner.toString() !== profile._id.toString()
      })
      watchlist.owners = updatedOwners
      await watchlist.save()

      if (typeof callback === 'function') {
        callback({ success: true })
      }

      if (watchlist.owners.length === 0) {
        await Watchlist.findByIdAndDelete(data.watchlist)
      } else {
        const updatedWatchlist = await getUpdatedWatchlist(watchlist._id)

        if (updatedWatchlist) {
          updatedWatchlist.private.owners.forEach((owner) => {
            const ownerSocket = getSocket(owner.user.toString())
            if (ownerSocket) {
              ownerSocket.emit('update watchlist', {
                watchlist: updatedWatchlist.public
              })
            }
          })
        }
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })

  socket.on('reorder watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist._id)

      if (!watchlist) {
        throw new Error('Watchlist not found')
      }

      const updatedOrder = {}
      data.watchlist.list.forEach((listItem) => {
        updatedOrder[listItem.content._id] = listItem.order + 1
      })

      watchlist.list.forEach((listItem) => {
        listItem.order = updatedOrder[listItem.content.toString()]
      })
      await watchlist.save()

      if (typeof callback === 'function') {
        callback({ success: true })
      }

      const updatedWatchlist = await getUpdatedWatchlist(watchlist._id)

      if (updatedWatchlist) {
        updatedWatchlist.owners.forEach((owner) => {
          const ownerSocket = getSocket(owner.user.toString())
          if (ownerSocket) {
            ownerSocket.emit('update watchlist', {
              watchlist: updatedWatchlist
            })
          }
        })
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })
}
