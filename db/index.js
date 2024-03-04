import mongoose from 'mongoose'
import { config } from 'dotenv'

config()

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Successfully connected to MongoDB')
  })
  .catch((e) => {
    console.error('Connection error', e.message)
  })

// mongoose.set('debug', true)

const db = mongoose.connection

export default db
