import { Schema } from 'mongoose'

export const collaborateSchema = new Schema({
  watchlist: { type: Schema.Types.ObjectId, ref: 'Watchlist', required: true },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})
