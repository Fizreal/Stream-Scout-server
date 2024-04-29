import { Schema } from 'mongoose'

export const watchedSchema = new Schema(
  {
    content: { type: Schema.Types.ObjectId, ref: 'Content', required: true },
    liked: { type: Boolean },
    disliked: { type: Boolean },
    mood: { type: String }
  },
  { timestamps: true }
)
