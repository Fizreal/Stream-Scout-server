import { Schema } from 'mongoose'

export const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    country: { type: String, required: true },
    subscriptions: [{ type: String }],
    friends: [{ type: Schema.Types.ObjectId, ref: 'Friend' }],
    watched: [{ type: Schema.Types.ObjectId, ref: 'Watched' }],
    username: { type: String, unique: true }
  },
  { timestamps: true }
)
