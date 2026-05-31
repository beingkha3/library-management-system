import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Reservation } from '../models/Reservation.js';
import { Review } from '../models/Review.js';
import { AppError } from '../utils/appError.js';
import { BORROW_STATUSES, RESERVATION_STATUSES } from '../utils/constants.js';

const PAGINATION_LIMIT_DEFAULT = 12;
const PAGINATION_LIMIT_MAX = 50;

const clampPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const buildBookFilter = (query = {}) => {
  const filter = { status: 'active' };

  if (query.search) {
    const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchPattern = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { title: searchPattern },
      { authors: searchPattern },
      { category: searchPattern },
      { isbn: searchPattern },
      { description: searchPattern }
    ];
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.featured === 'true') {
    filter.featured = true;
  }

  if (query.author) {
    filter.authors = query.author;
  }

  if (query.language) {
    filter.language = query.language;
  }

  if (query.publishedYear) {
    const publishedYear = Number(query.publishedYear);
    if (Number.isFinite(publishedYear)) {
      filter.publishedYear = publishedYear;
    }
  }

  if (query.availability === 'available') {
    filter.availableCopies = { $gt: 0 };
  }

  if (query.availability === 'unavailable') {
    filter.availableCopies = { $lte: 0 };
  }

  if (query.minRating) {
    const minRating = Number(query.minRating);
    if (Number.isFinite(minRating)) {
      filter.averageRating = { $gte: minRating };
    }
  }

  return filter;
};

const getBookSort = (sort) => {
  switch (sort) {
    case 'title-asc':
      return { title: 1, createdAt: -1 };
    case 'year-desc':
      return { publishedYear: -1, title: 1 };
    case 'rating-desc':
      return { averageRating: -1, reviewCount: -1, title: 1 };
    case 'available-desc':
      return { availableCopies: -1, title: 1 };
    case 'featured':
    default:
      return { featured: -1, createdAt: -1 };
  }
};

const getBookFacets = async () => {
  const [categories, authors, years, languages] = await Promise.all([
    Book.distinct('category', { status: 'active' }),
    Book.distinct('authors', { status: 'active' }),
    Book.distinct('publishedYear', { status: 'active' }),
    Book.distinct('language', { status: 'active' })
  ]);

  return {
    categories: categories.filter(Boolean).sort((left, right) => left.localeCompare(right)),
    authors: authors.filter(Boolean).sort((left, right) => left.localeCompare(right)),
    years: years.filter(Boolean).sort((left, right) => right - left),
    languages: languages.filter(Boolean).sort((left, right) => left.localeCompare(right))
  };
};

const applyReviewStats = async (bookId) => {
  const reviews = await Review.find({ book: bookId });
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? 0
      : Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount).toFixed(1));

  await Book.findByIdAndUpdate(bookId, { reviewCount, averageRating });
};

const getHeldCopyCount = async (bookId) => {
  const [activeLoans, readyReservations] = await Promise.all([
    Borrow.countDocuments({
      book: bookId,
      status: { $in: [BORROW_STATUSES.ACTIVE, BORROW_STATUSES.OVERDUE, BORROW_STATUSES.LOST] }
    }),
    Reservation.countDocuments({
      book: bookId,
      status: RESERVATION_STATUSES.READY
    })
  ]);

  return activeLoans + readyReservations;
};

export const listBooks = async (query = {}) => {
  const filter = buildBookFilter(query);
  const sort = getBookSort(query.sort);

  if (query.paginate === 'true') {
    const page = clampPositiveInt(query.page, 1);
    const limit = Math.min(clampPositiveInt(query.limit, PAGINATION_LIMIT_DEFAULT), PAGINATION_LIMIT_MAX);
    const [total, facets] = await Promise.all([
      Book.countDocuments(filter),
      getBookFacets()
    ]);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;
    const items = await Book.find(filter).sort(sort).skip(skip).limit(limit);

    return {
      items,
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      },
      facets
    };
  }

  return Book.find(filter).sort(sort);
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
    reservedCopies: 0
  });

  return book;
};

export const updateBook = async (bookId, payload) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new AppError('Book not found', 404);
  }

  const heldCopies = await getHeldCopyCount(bookId);
  const nextTotalCopies = payload.totalCopies !== undefined ? Number(payload.totalCopies) : book.totalCopies;

  if (nextTotalCopies < heldCopies) {
    throw new AppError('Total copies cannot be lower than active loans and ready reservations', 400);
  }

  Object.assign(book, payload);

  if (payload.totalCopies !== undefined) {
    book.totalCopies = nextTotalCopies;
  }

  if (payload.availableCopies !== undefined) {
    book.availableCopies = Number(payload.availableCopies);
  }

  const maxAvailableCopies = Math.max(book.totalCopies - heldCopies, 0);

  if (book.availableCopies > maxAvailableCopies) {
    if (payload.availableCopies !== undefined) {
      throw new AppError('Available copies cannot exceed total copies minus active loans and ready reservations', 400);
    }

    book.availableCopies = maxAvailableCopies;
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
