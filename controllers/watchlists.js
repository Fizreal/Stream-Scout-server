import { getIO } from '../utils/socket.js'
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

  socket.on('get all watchlists', async (callback) => {
    try {
      const watchlists = await getUserWatchlists(socket.user.id)
      if (typeof callback === 'function') {
        callback(watchlist)
      }
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback(null)
      }
    }
  })

  socket.on('get watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
        .populate({ path: 'owners', model: 'Profile' })
        .populate({ path: 'list.content', model: 'Content' })

      const invites = await Collaborate.find({ watchlist: watchlist._id })

      if (typeof callback === 'function') {
        // include invites in the callback
        callback(watchlist)
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

      const checkWatchlist = await Watchlist.findOne({
        name: data.name,
        owners: { $in: [profile._id] }
      })

      if (checkWatchlist) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            error: 'Watchlist already exists with that name'
          })
        }
        return
      }

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

      const updatedWatchlists = await getUserWatchlists(socket.user.id)

      if (typeof callback === 'function') {
        callback({ success: true, watchlists: updatedWatchlists })
      }
      // emit to all owners of the watchlist
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })

  socket.on('remove from watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
      const removedContentPosition = watchlist.list.find(
        (listItem) => String(listItem.content) === data.content
      )
      watchlist.list.filter(
        (listItem) => String(listItem.content) !== data.content
      )
      watchlist.list.forEach((listItem) => {
        if (listItem.order > removedContentPosition) {
          listItem.order--
        }
      })
      await watchlist.save()
      // callback function
      // emit to all owners of the watchlist
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('leave watchlist', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id })
      const watchlist = await Watchlist.findById(data.watchlist)
      watchlist.owners.filter(
        (owner) => owner.toString() !== profile._id.toString()
      )
      if (watchlist.owners.length === 0) {
        await Watchlist.findByIdAndDelete(data.watchlist)
        // callback function
      } else {
        await watchlist.save()
        // callback function
        // emit to all owners of the watchlist
      }
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('reorder watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist._id)

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

      // emit to all owners of the watchlist
    } catch (error) {
      console.log(error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error })
      }
    }
  })
}
