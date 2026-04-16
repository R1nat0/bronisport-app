import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

import * as service from '../services/passwordResetService.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток, подождите 15 минут' },
});

const forgotSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const verifySchema = z.object({
  email: z.string().email().toLowerCase(),
  code: z.string().length(6),
});

const resetSchema = z.object({
  email: z.string().email().toLowerCase(),
  resetToken: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

router.post('/forgot', resetLimiter, validateBody(forgotSchema), async (req, res, next) => {
  try {
    await service.requestReset(req.body.email);
    res.json({ ok: true, message: 'Если аккаунт существует, код отправлен на email' });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-code', resetLimiter, validateBody(verifySchema), async (req, res, next) => {
  try {
    const resetToken = await service.verifyCode(req.body.email, req.body.code);
    res.json({ ok: true, resetToken });
  } catch (err) {
    next(err);
  }
});

const REFRESH_COOKIE = 'bronisport_refresh';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

router.post('/reset-password', validateBody(resetSchema), async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await service.resetPassword(
      req.body.email,
      req.body.resetToken,
      req.body.newPassword
    );
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/api/auth',
    });
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
});

export default router;
