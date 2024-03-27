import { Schema } from 'mongoose'

export const watchlistSchema = new Schema(
  {
    owners: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    name: { type: String, required: true },
    list: [
      {
        content: {
          type: Schema.Types.ObjectId,
          ref: 'Content',
          required: true
        },
        order: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
)
