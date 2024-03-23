import { getIO } from '../utils/socket.js'

import { Watchlist, Content, Profile } from '../models/index.js'

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

  socket.on('create watchlist', async (data, callback) => {
    try {
      const profile = await Profile.findOne({ user: socket.user.id })
      const watchlist = await Watchlist.create({
        owners: [profile._id],
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
    } catch (error) {
      console.log(error)
    }
  })

  socket.on('delete watchlist', async (data, callback) => {
    try {
      await Watchlist.findByIdAndDelete(data.watchlist)
      // callback function
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
    } catch (error) {
      console.log(error)
    }
  })
}
