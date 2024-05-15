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
          model: 'Profile'
        }
      })
      .populate({
        path: 'watched',
        populate: {
          path: 'content',
          model: 'Content'
        }
      })

    if (!profile) {
      return null
    }

    const formattedFriends = profile.friends.map((friend) => {
      return {
        _id: friend._id,
        recipient: formatProfileInformation(friend.recipient),
        status: friend.status
      }
    })

    const updatedProfile = { ...profile._doc, friends: formattedFriends }

    return updatedProfile
  }

  const getWatchlists = async (id) => {
    const profile = await Profile.findOne({ user: id })

    if (!profile) {
      return null
    }

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

    if (!watchlists) {
      return null
    }

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

  socket.on('get profile information', async (callback) => {
    const profileInfo = await getProfileInformation(socket.user.id)
    if (typeof callback === 'function') {
      callback(profileInfo)
    }
  })

  socket.on('get profile', async (callback) => {
    const profile = await getProfile(socket.user.id)
    if (typeof callback === 'function') {
      callback(profile)
    }
  })

  socket.on('search profiles', async (data, callback) => {
    try {
      const profiles = await Profile.find({ user: { $ne: socket.user.id } })

      const levenshteinProfiles = profiles
        .map((profile) => {
          const distance = levenshtein.get(profile.username, data.search)
          if (distance / data.search.length < 0.5) {
            profile.distance = distance
            return profile
          } else {
            return null
          }
        })
        .filter((profile) => profile !== null)
      const orderedProfiles = levenshteinProfiles.sort(
        (a, b) => a.distance - b.distance
      )

      if (typeof callback === 'function') {
        callback({ success: true, profiles: orderedProfiles })
      }
    } catch (error) {
      console.error('Error searching profiles:', error)
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message })
      }
    }
  })

  socket.on('check username', async (data, callback) => {
    const profile = await Profile.findOne({ username: data.username })
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

  socket.on('check online', async (data, callback) => {
    try {
      const userSocket = getSocket(data.id)
      if (typeof callback === 'function') {
        callback({ online: userSocket ? true : false })
      }
    } catch (error) {
      console.error('Error checking online:', error)
      if (typeof callback === 'function') {
        callback({ online: false })
      }
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

        if (typeof callback === 'function') {
          callback({ success: true, updatedProfile: updatedUserProfile })
        }

        const requestedSocket = getSocket(requestedProfile.user)
        if (requestedSocket) {
          const updatedRequestedProfile = await getProfile(
            requestedProfile.user
          )
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

      if (typeof callback === 'function') {
        callback({ success: true, updatedProfile: updatedUserProfile })
      }

      const requesterSocket = getSocket(requesterProfile.user)
      if (requesterSocket) {
        const updatedRequesterProfile = await getProfileInformation(
          requesterProfile.user
        )
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

  socket.on('delete friend record', async (data, callback) => {
    try {
      const userProfile = await Profile.findOne({ user: socket.user.id })
      const requesterProfile = await Profile.findById(data.requesterId)

      const friendA = await Friend.findOne({
        requester: userProfile._id,
        recipient: requesterProfile._id
      })
      const friendB = await Friend.findOne({
        requester: requesterProfile._id,
        recipient: userProfile._id
      })

      if (!friendA || !friendB) {
        throw new Error('Friend record not found')
      }

      userProfile.friends = userProfile.friends.filter((friend) => {
        return friend.toString() !== friendA._id.toString()
      })
      requesterProfile.friends = requesterProfile.friends.filter((friend) => {
        return friend.toString() !== friendB._id.toString()
      })

      await userProfile.save()
      await requesterProfile.save()

      await Friend.findByIdAndDelete(friendA._id)
      await Friend.findByIdAndDelete(friendB._id)

      const updatedUserProfile = await getProfile(socket.user.id)

      if (typeof callback === 'function') {
        console.log(updatedUserProfile)
        callback({ success: true, updatedProfile: updatedUserProfile })
      }

      const requesterSocket = getSocket(requesterProfile.user)
      if (requesterSocket) {
        const updatedRequesterProfile = await getProfile(requesterProfile.user)
        io.to(requesterSocket).emit('profile update', {
          updatedProfile: updatedRequesterProfile
        })
      }
    } catch (error) {
      console.error('Error deleting friend request:', error)
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
