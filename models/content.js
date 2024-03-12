import { Schema } from 'mongoose'

export const contentSchema = new Schema({
  tmdbId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  streamingInfo: [
    {
      availability: [
        {
          addon: { type: String },
          leaving: { type: String },
          link: { type: String },
          service: { type: String, required: true },
          streamingType: {
            type: String,
            enum: ['subscription', 'addon'],
            required: true
          }
        }
      ],
      country: { type: String, required: true }
    }
  ],
  genres: [{ type: String, required: true }],
  releaseYear: { type: Number, required: true },
  streamingValidated: {
    lastUpdated: { type: Date },
    validated: { type: Boolean, required: true }
  },
  type: { type: String, required: true, enum: ['movie', 'series'] },
  backdrop: { type: String, required: true },
  runtime: { type: Number },
  poster: { type: String, required: true },
  overview: { type: String, required: true },
  // ratings will be a number with the last two digits representing the decimals
  rating: { type: Number, required: true }
})
