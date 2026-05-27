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
import { validateRequest } from '../middleware/validateRequest.js';
import { ROLES } from '../utils/constants.js';
import { bookSchemas, commonSchemas } from '../validations/requestSchemas.js';

const router = Router();

router.get('/', validateRequest(bookSchemas.list), getBooks);
router.get('/:id', validateRequest(commonSchemas.idParam), getBook);
router.post('/', protect, requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(bookSchemas.create), postBook);
router.patch('/:id', protect, requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(bookSchemas.update), patchBook);
router.delete('/:id', protect, requireRoles(ROLES.LIBRARIAN, ROLES.ADMIN), validateRequest(commonSchemas.idParam), deleteBook);
router.post('/:id/reviews', protect, validateRequest(bookSchemas.review), upsertReview);

export default router;
