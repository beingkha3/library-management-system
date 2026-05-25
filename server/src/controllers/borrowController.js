import { asyncHandler } from '../utils/asyncHandler.js';
import { issueBook, listBorrows, renewBorrow, returnBook } from '../services/borrowService.js';

export const getBorrows = asyncHandler(async (req, res) => {
  const borrows = await listBorrows({ user: req.user, query: req.query });
  res.json({ success: true, data: borrows });
});

export const postBorrow = asyncHandler(async (req, res) => {
  const borrow = await issueBook({
    actor: req.user,
    userId: req.body.userId || req.user._id,
    bookId: req.body.bookId
  });

  res.status(201).json({ success: true, message: 'Borrow issued successfully', data: borrow });
});

export const postRenew = asyncHandler(async (req, res) => {
  const borrow = await renewBorrow({ borrowId: req.params.id, actor: req.user });
  res.json({ success: true, message: 'Borrow renewed successfully', data: borrow });
});

export const postReturn = asyncHandler(async (req, res) => {
  const borrow = await returnBook({ borrowId: req.params.id, actor: req.user });
  res.json({ success: true, message: 'Book returned successfully', data: borrow });
});
