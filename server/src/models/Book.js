import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    authors: {
      type: [String],
      required: true,
      default: []
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    publisher: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'English'
    },
    edition: {
      type: String,
      default: ''
    },
    publishedYear: {
      type: Number,
      default: null
    },
    pageCount: {
      type: Number,
      default: null
    },
    coverImageUrl: {
      type: String,
      default: ''
    },
    shelfLocation: {
      type: String,
      default: ''
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0
    },
    reservedCopies: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    },
    featured: {
      type: Boolean,
      default: false
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

bookSchema.index({ title: 'text', authors: 'text', category: 'text', description: 'text' });

export const Book = mongoose.model('Book', bookSchema);
