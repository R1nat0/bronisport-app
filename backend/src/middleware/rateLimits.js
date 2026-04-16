import rateLimit from 'express-rate-limit';

export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов, подождите минуту' },
});
