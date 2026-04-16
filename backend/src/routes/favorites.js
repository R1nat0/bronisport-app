import { Router } from 'express';
import * as service from '../services/favoriteService.js';
import { requireAuth } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimits.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    res.json(await service.listMyFavorites(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.post('/:facilityId', writeLimiter, async (req, res, next) => {
  try {
    res.status(201).json(await service.addFavorite(req.user.id, req.params.facilityId));
  } catch (err) {
    next(err);
  }
});

router.delete('/:facilityId', async (req, res, next) => {
  try {
    res.json(await service.removeFavorite(req.user.id, req.params.facilityId));
  } catch (err) {
    next(err);
  }
});

export default router;
