import { Router } from 'express';

import {
  deleteBook,
  getBook,
  getBooks,
  patchBook,
  postBook,
  upsertReview
} from '../controllers/bookController.js';
import { protect, requireRoles } from '../middleware/authMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/', protect, requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), postBook);
router.patch('/:id', protect, requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), patchBook);
router.delete('/:id', protect, requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), deleteBook);
router.post('/:id/reviews', protect, upsertReview);

export default router;
