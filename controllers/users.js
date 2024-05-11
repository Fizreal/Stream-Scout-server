import { getIO, getSocket, removeSocket } from '../utils/socket.js'

import { User, Profile, Friend, Watchlist } from '../models/index.js'
import { formatProfileInformation } from '../utils/index.js'
import levenshtein from 'fast-levenshtein'

export default (socket) => {
  const io = getIO()

  const getProfile = async (id) => {
    const profile = await Profile.findOne({ user: id })
      .populate({
        path: 'friends',
        populate: {
          path: 'recipient',
          model: 'User'
        }
      })
      .populate({
        path: 'watched',
        populate: {
          path: 'content',
          model: 'Content'
        }
      })
    return profile
  }

  const getWatchlists = async (id) => {
    const profile = await Profile.findOne({ user: id })
    const watchlists = await Watchlist.find({
      owners: { $in: [profile._id] }
    })
      .populate({
        path: 'list.content',
        model: 'Content'
      })
      .populate({
        path: 'owners',
        model: 'Profile'
      })

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
  }

  const getProfileInformation = async (id) => {
    const profile = await getProfile(id)
    const watchlists = await getWatchlists(id)
    return { profile, watchlists }
  }

  getProfileInformation(socket.user.id)
    .then((profileInfo) => {
      socket.emit('connected', profileInfo)
    })
    .catch((error) => {
      console.error('Error fetching profile:', error)
    })

  socket.on('get profile', async (callback) => {
    const profile = await getProfile(socket.user.id)
    if (typeof callback === 'function') {
      callback(profile)
    }
  })

  socket.on('search profiles', async (callback) => {
    try {
      const profiles = await Profile.find({ user: { $ne: socket.user.id } })
      const levenshteinProfiles = profiles
        .map((profile) => {
          const distance = levenshtein.get(profile.username, data.search)
          if (distance / data.search.length < 0.5) {
            return { ...profile, distance }
          } else {
            return null
          }
        })
        .filter((profile) => profile !== null)

      const orderedProfiles = levenshteinProfiles.sort(
        (a, b) => a.distance - b.distance
      )

      if (typeof callback === 'function') {
        callback({ success: true, profiles })
      }
    } catch (error) {
      console.error('Error searching profiles:', error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('check username', async (data, callback) => {
    const profile = await Profile.findOne({ username: data })
    let unique = profile ? false : true
    console.log(profile, data, unique)
    if (typeof callback === 'function') {
      callback(unique)
    }
  })

  socket.on('update profile', async (data, callback) => {
    let profile = await Profile.findOne({ user: socket.user.id })
    if (profile) {
      profile.country = data.country
      profile.subscriptions = data.services
      profile.username = data.username
      await profile.save()
    } else {
      const user = await User.findById(socket.user.id)
      profile = await Profile.create({
        user: user._id,
        country: data.country,
        subscriptions: data.subscriptions,
        friends: [],
        watched: [],
        username: data.username
      })
    }

    if (typeof callback === 'function') {
      callback(profile)
    }
  })

  socket.on('add friend', async (data, callback) => {
    try {
      const userProfile = await Profile.findOne({ user: socket.user.id })
      const requestedProfile = await Profile.findById(data.recipientId)

      const checkFriendRequest = await Friend.findOne({
        requester: userProfile._id,
        recipient: requestedProfile._id
      })

      if (!checkFriendRequest) {
        const friendA = await Friend.create({
          requester: userProfile._id,
          recipient: requestedProfile._id,
          status: 2
        })
        const friendB = await Friend.create({
          requester: requestedProfile._id,
          recipient: userProfile._id,
          status: 1
        })

        userProfile.friends.push(friendA._id)
        await userProfile.save()

        requestedProfile.friends.push(friendB._id)
        await requestedProfile.save()

        const updatedUserProfile = await getProfile(socket.user.id)
        const updatedRequestedProfile = await getProfile(requestedProfile.user)

        if (typeof callback === 'function') {
          callback({ success: true, updatedProfile: updatedUserProfile })
        }

        const requestedSocket = getSocket(requestedProfile.user)
        if (requestedSocket) {
          io.to(requestedSocket).emit('profile update', {
            updatedProfile: updatedRequestedProfile
          })
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('accept friend', async (data, callback) => {
    try {
      const userProfile = await Profile.findOne({ user: socket.user.id })
      const requesterProfile = await Profile.findById(data.requesterId)

      const friendA = await Friend.findOneAndUpdate(
        {
          requester: userProfile._id,
          recipient: requesterProfile._id
        },
        { status: 3 }
      )
      await friendA.save()

      const friendB = await Friend.findOneAndUpdate(
        {
          requester: requesterProfile._id,
          recipient: userProfile._id
        },
        { status: 3 }
      )
      await friendB.save()

      const updatedUserProfile = await getProfileInformation(socket.user.id)
      const updatedRequesterProfile = await getProfileInformation(
        requesterProfile.user
      )

      if (typeof callback === 'function') {
        callback({ success: true, updatedUserProfile })
      }

      const requesterSocket = getSocket(requesterProfile.user)
      if (requesterSocket) {
        io.to(requesterSocket).emit('profile update', {
          updatedProfile: updatedRequesterProfile
        })
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('reject friend', async (data, callback) => {
    try {
      const userProfile = await Profile.findOne({ user: socket.user.id })
      const requesterProfile = await Profile.findById(data.requesterId)

      const friendA = await Friend.findOneAndDelete({
        requester: userProfile._id,
        recipient: requesterProfile._id
      })

      const friendB = await Friend.findOneAndDelete({
        requester: requesterProfile._id,
        recipient: userProfile._id
      })

      const updatedUserProfile = await getProfile(socket.user.id)
      const updatedRequesterProfile = await getProfile(requesterProfile.user)

      if (typeof callback === 'function') {
        callback({ success: true, updatedUserProfile })
      }

      const requesterSocket = getSocket(requesterProfile.user)
      if (requesterSocket) {
        io.to(requesterSocket).emit('profile update', {
          updatedProfile: updatedRequesterProfile
        })
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('disconnect', () => {
    removeSocket(socket.user.id)
    console.log(`a user disconnected ${socket.id}`)
  })
}
