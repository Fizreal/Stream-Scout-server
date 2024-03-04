import { Schema } from 'mongoose'

export default ProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    country: { type: String },
    subscriptions: [{ type: String }],
    friends: [{ type: Schema.Types.ObjectId, ref: 'Friend', unique: true }],
    username: { type: String, unique: true }
  },
  { timestamps: true }
)
