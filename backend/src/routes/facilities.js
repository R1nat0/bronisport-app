import { Router } from 'express';
import { z } from 'zod';

import * as service from '../services/facilityService.js';
import { validateQuery } from '../middleware/validate.js';

const router = Router();

const listQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  sport: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

router.get('/', validateQuery(listQuerySchema), async (req, res, next) => {
  try {
    res.json(await service.listFacilities(req.query));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await service.getFacilityById(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.get('/courts/:courtId/slots', validateQuery(slotsQuerySchema), async (req, res, next) => {
  try {
    res.json(await service.getCourtSlots(req.params.courtId, req.query.date));
  } catch (err) {
    next(err);
  }
});

export default router;
