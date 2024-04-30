import { Schema } from 'mongoose'

export const contentSchema = new Schema({
  tmdbId: { type: String, required: true },
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
  poster: { type: String, required: true },
  overview: { type: String, required: true },
  rating: { type: Number, required: true },
  likes: { type: Number, required: true, min: 0 },
  dislikes: { type: Number, required: true, min: 0 },
  // movies only
  runtime: { type: Number },
  // series only
  seasons: [
    {
      air_date: { type: String },
      episode_count: { type: Number },
      name: { type: String },
      overview: { type: String },
      poster: { type: String },
      season_number: { type: Number },
      rating: { type: Number }
    }
  ]
})
