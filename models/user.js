import { Schema } from 'mongoose'

export default userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordDigest: { type: String, required: true }
  },
  { timestamps: true }
)
