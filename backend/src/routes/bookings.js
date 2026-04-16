import { Router } from 'express';
import { z } from 'zod';

import * as service from '../services/bookingService.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimits.js';

const router = Router();

const createSchema = z.object({
  courtId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM'),
  duration: z.coerce.number().int().min(1).max(4).default(1),
});

const listQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
});

router.use(requireAuth);

router.post('/', requireRole('athlete'), writeLimiter, validateBody(createSchema), async (req, res, next) => {
  try {
    const booking = await service.createBooking({
      userId: req.user.id,
      ...req.body,
    });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

router.get('/my', validateQuery(listQuerySchema), async (req, res, next) => {
  try {
    res.json(await service.listMyBookings({ userId: req.user.id, status: req.query.status }));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    res.json(await service.cancelBooking({ userId: req.user.id, bookingId: req.params.id }));
  } catch (err) {
    next(err);
  }
});

export default router;
