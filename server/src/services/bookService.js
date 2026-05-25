import { Book } from '../models/Book.js';
import { Review } from '../models/Review.js';
import { AppError } from '../utils/appError.js';

const applyReviewStats = async (bookId) => {
  const reviews = await Review.find({ book: bookId });
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount).toFixed(1));

  await Book.findByIdAndUpdate(bookId, { reviewCount, averageRating });
};

export const listBooks = async (query = {}) => {
  const filter = { status: 'active' };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.featured === 'true') {
    filter.featured = true;
  }

  const books = await Book.find(filter).sort({ featured: -1, createdAt: -1 });
  return books;
};

export const getBookById = async (bookId) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  const reviews = await Review.find({ book: bookId }).populate('user', 'name role').sort({ createdAt: -1 });

  return { book, reviews };
};

export const createBook = async (payload) => {
  const totalCopies = Number(payload.totalCopies);
  const availableCopies = Math.max(
    0,
    Math.min(Number(payload.availableCopies ?? totalCopies), totalCopies)
  );

  const book = await Book.create({
    ...payload,
    totalCopies,
    availableCopies,
    reservedCopies: payload.reservedCopies ?? 0
  });

  return book;
};

export const updateBook = async (bookId, payload) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  Object.assign(book, payload);

  if (payload.totalCopies !== undefined) {
    book.totalCopies = Number(payload.totalCopies);
  }

  if (payload.availableCopies !== undefined) {
    book.availableCopies = Number(payload.availableCopies);
  }

  if (book.availableCopies > book.totalCopies) {
    book.availableCopies = book.totalCopies;
  }

  if (book.availableCopies < 0) {
    book.availableCopies = 0;
  }

  await book.save();
  return book;
};

export const archiveBook = async (bookId) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  book.status = 'archived';
  await book.save();
  return book;
};

export const addOrUpdateReview = async ({ userId, bookId, rating, comment }) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  await Review.findOneAndUpdate(
    { user: userId, book: bookId },
    { rating, comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await applyReviewStats(bookId);
  return getBookById(bookId);
};
