import { Schema } from 'mongoose'

export default friendsSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
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
