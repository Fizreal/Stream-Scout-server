import { getIO } from '../utils/socket.js'

import { Watchlist, Content, User } from '../models/index.js'

export default (socket) => {
  const io = getIO()

  socket.on('get all watchlists', async (callback) => {
    try {
      const watchlists = await Watchlist.find({
        owners: { $in: [socket.user.id] }
      })
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
        .populate({ path: 'owners', model: 'User' })
        .populate({ path: 'list.content', model: 'Content' })
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

  socket.on('create watchlist', async (data, callback) => {
    try {
      const user = await User.findById(socket.user.id)
      const watchlist = await Watchlist.create({
        owners: [user._id],
        name: data.name,
        list: []
        // callback function
      })
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('add to watchlist', async (data, callback) => {
    try {
      const watchlist = await Watchlist.findById(data.watchlist)
      const content = await Content.findById(data.content)
      watchlist.list.push({
        content: content._id,
        order: watchlist.list.length
      })
      await watchlist.save()
      // callback function
      // emit to all owners of the watchlist
    } catch (error) {
      console.log(error)
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
      const watchlist = await Watchlist.findById(data.watchlist)
      watchlist.owners.filter((owner) => String(owner) !== socket.user.id)
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
      const watchlist = await Watchlist.findById(data.watchlist)
      //expect data to be an object with keys equal to content ids and values equal to new order
      watchlist.list.forEach((listItem) => {
        listItem.order = data.content[listItem.content]
      })
      await watchlist.save()
      // callback function
      // emit to all owners of the watchlist
    } catch (error) {
      console.log(error)
    }
  })
}
