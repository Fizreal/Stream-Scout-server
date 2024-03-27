import mongoose from 'mongoose'
import { userSchema } from './user.js'
import { profileSchema } from './profile.js'
import { friendsSchema } from './friend.js'
import { contentSchema } from './content.js'
import { watchlistSchema } from './watchlist.js'
import { watchedSchema } from './watched.js'
import { collaborateSchema } from './collaborate.js'

export const User = mongoose.model('User', userSchema)
export const Profile = mongoose.model('Profile', profileSchema)
export const Friend = mongoose.model('Friend', friendsSchema)
export const Content = mongoose.model('Content', contentSchema)
export const Watchlist = mongoose.model('Watchlist', watchlistSchema)
export const Watched = mongoose.model('Watched', watchedSchema)
export const Collaborate = mongoose.model('Collaborate', collaborateSchema)
