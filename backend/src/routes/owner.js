import { Router } from 'express';
import { z } from 'zod';

import * as facilityService from '../services/ownerFacilityService.js';
import * as bookingService from '../services/ownerBookingService.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadPhotos, optimizePhotos } from '../middleware/upload.js';
import { badRequest } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth, requireRole('organizer'));

const timeRe = /^\d{2}:\d{2}$/;

const createFacilitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  sport: z.string().trim().min(1).max(60),
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  pricePerHour: z.coerce.number().int().positive(),
  openTime: z.string().regex(timeRe).default('08:00'),
  closeTime: z.string().regex(timeRe).default('22:00'),
});

const updateFacilitySchema = createFacilitySchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
});

const bookingsQuerySchema = z.object({
  facilityId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const bookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']),
});

const createBookingSchema = z.object({
  facilityId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRe),
  duration: z.coerce.number().int().min(1).max(4).default(1),
  guestName: z.string().trim().min(1).max(120),
  guestPhone: z.string().trim().max(40).optional().or(z.literal('')),
});

// ----------------- facilities -----------------

router.get('/facilities', async (req, res, next) => {
  try {
    res.json(await facilityService.listMyFacilities(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.get('/facilities/:id', async (req, res, next) => {
  try {
    res.json(await facilityService.getMyFacility(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post('/facilities', validateBody(createFacilitySchema), async (req, res, next) => {
  try {
    const f = await facilityService.createFacility(req.user.id, req.body);
    res.status(201).json(f);
  } catch (err) {
    next(err);
  }
});

router.patch('/facilities/:id', validateBody(updateFacilitySchema), async (req, res, next) => {
  try {
    res.json(await facilityService.updateFacility(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete('/facilities/:id', async (req, res, next) => {
  try {
    res.json(await facilityService.deleteFacility(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
});

// ----------------- photos -----------------

function runUpload(req, res, next) {
  uploadPhotos(req, res, (err) => {
    if (err) return next(badRequest(err.message));
    next();
  });
}

router.post('/facilities/:id/photos', runUpload, async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw badRequest('No files uploaded (field name must be "photos")');
    }
    const optimized = await optimizePhotos(req.files);
    const urls = optimized.map((o) => o.url);
    const photos = await facilityService.addPhotos(req.user.id, req.params.id, urls);
    res.status(201).json(photos);
  } catch (err) {
    next(err);
  }
});

router.delete('/facilities/:id/photos/:photoId', async (req, res, next) => {
  try {
    res.json(await facilityService.deletePhoto(req.user.id, req.params.id, req.params.photoId));
  } catch (err) {
    next(err);
  }
});

// ----------------- bookings -----------------

router.post('/bookings', validateBody(createBookingSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.createOwnerBooking(req.user.id, req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

router.get('/bookings', validateQuery(bookingsQuerySchema), async (req, res, next) => {
  try {
    res.json(await bookingService.listOwnerBookings(req.user.id, req.query));
  } catch (err) {
    next(err);
  }
});

router.patch('/bookings/:id', validateBody(bookingStatusSchema), async (req, res, next) => {
  try {
    res.json(await bookingService.updateBookingStatus(req.user.id, req.params.id, req.body.status));
  } catch (err) {
    next(err);
  }
});

// ----------------- stats -----------------

router.get('/stats', async (req, res, next) => {
  try {
    res.json(await bookingService.getOwnerStats(req.user.id));
  } catch (err) {
    next(err);
  }
});

export default router;
