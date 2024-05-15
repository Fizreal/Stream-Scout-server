import { Schema } from 'mongoose'

export const friendsSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'Profile' },
    recipient: { type: Schema.Types.ObjectId, ref: 'Profile' },
    status: {
      type: Number,
      enum: [
        0, // 'add friend',
        1, // 'requested',
        2, // 'pending',
        3 // 'friends'
      ]
    }
  },
  { timestamps: true }
)
