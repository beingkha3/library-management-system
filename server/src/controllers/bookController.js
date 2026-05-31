import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addOrUpdateReview,
  archiveBook,
  createBook,
  deleteReview,
  getBookById,
  listBooks,
  updateBook
} from '../services/bookService.js';

export const getBooks = asyncHandler(async (req, res) => {
  const books = await listBooks(req.query);
  res.json({ success: true, data: books });
});

export const getBook = asyncHandler(async (req, res) => {
  const data = await getBookById(req.params.id);
  res.json({ success: true, data });
});

export const postBook = asyncHandler(async (req, res) => {
  const book = await createBook(req.body);
  res.status(201).json({ success: true, message: 'Book created successfully', data: book });
});

export const patchBook = asyncHandler(async (req, res) => {
  const book = await updateBook(req.params.id, req.body);
  res.json({ success: true, message: 'Book updated successfully', data: book });
});

export const deleteBook = asyncHandler(async (req, res) => {
  const book = await archiveBook(req.params.id);
  res.json({ success: true, message: 'Book archived successfully', data: book });
});

export const upsertReview = asyncHandler(async (req, res) => {
  const data = await addOrUpdateReview({
    userId: req.user._id,
    bookId: req.params.id,
    rating: req.body.rating,
    comment: req.body.comment
  });

  res.json({ success: true, message: 'Review saved successfully', data });
});

export const removeReview = asyncHandler(async (req, res) => {
  const data = await deleteReview({ reviewId: req.params.reviewId });
  res.json({ success: true, message: 'Review removed successfully', data });
});
