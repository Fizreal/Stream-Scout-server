import mongoose from 'mongoose'
import userSchema from './user'
import profileSchema from './profile'
import friendsSchema from './friend'

export const User = mongoose.model('User', userSchema)
export const Profile = mongoose.model('Profile', profileSchema)
export const Friend = mongoose.model('Friend', friendsSchema)
