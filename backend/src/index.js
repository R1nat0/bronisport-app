import 'dotenv/config';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
}

import { createApp } from './app.js';
import { prisma } from './prisma.js';

const port = Number(process.env.PORT) || 4000;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`[bronisport-api] listening on http://localhost:${port}`);
});

const shutdown = async (signal) => {
  console.log(`[bronisport-api] ${signal} received, shutting down...`);
  server.close(() => console.log('[bronisport-api] http server closed'));
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
