import { Router } from 'express';
import { z } from 'zod';

import * as service from '../services/reviewService.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  facilityId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(1).max(2000),
});

router.post('/', requireAuth, requireRole('athlete'), validateBody(createSchema), async (req, res, next) => {
  try {
    const review = await service.createReview({ userId: req.user.id, ...req.body });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

export default router;
