import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { prisma } from './prisma.js';
import authRouter from './routes/auth.js';
import facilitiesRouter from './routes/facilities.js';
import bookingsRouter from './routes/bookings.js';
import favoritesRouter from './routes/favorites.js';
import ownerRouter from './routes/owner.js';
import usersRouter from './routes/users.js';
import passwordResetRouter from './routes/passwordReset.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use('/api/auth', authRouter);
  app.use('/api/facilities', facilitiesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/owner', ownerRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/auth', passwordResetRouter);
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'up', ts: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ status: 'degraded', db: 'down', error: err.message });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500 && process.env.SENTRY_DSN) {
      import('@sentry/node').then((Sentry) => Sentry.captureException(err)).catch(() => {});
    }
    res.status(status).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  });

  return app;
}
