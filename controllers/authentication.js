import { Profile, User } from '../models/index.js'
import {
  hashPassword,
  comparePassword,
  createToken
} from '../middleware/index.js'

export const Register = async (req, res) => {
  try {
    const { email, password, name } = req.body
    let passwordDigest = await hashPassword(password)
    let existingUser = await User.findOne({ email })
    if (existingUser) {
      return res
        .status(400)
        .send('That email is already registered to an account')
    } else {
      const user = await User.create({ name, email, passwordDigest })
      res.send(user)
    }
  } catch (error) {
    throw error
  }
}

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (user) {
      let matched = await comparePassword(user.passwordDigest, password)
      if (matched) {
        let profile = await Profile.findOne({ user: user._id })
        let payload = { id: user._id, email: user.email }
        let token = createToken(payload)
        return res.status(200).send({ user: profile, token })
      }
      return res
        .status(400)
        .send('Invalid email or password. Please try again.')
    }
    res.status(400).send('Invalid email or password. Please try again.')
  } catch (error) {
    console.log(error)
    res.status(401).send({ status: 'Error', msg: 'An error has occurred' })
  }
}

export const CheckSession = async (req, res) => {
  const { payload } = res.locals

  let profile = await Profile.findOne({ user: payload.id })
  if (!profile) {
    return res.status(400).send('No profile found')
  }

  let sessionPayload = { user: profile, token: res.locals.token }

  res.status(200).send(sessionPayload)
}
