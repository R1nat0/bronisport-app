#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Completing past bookings..."
node src/scripts/completeBookings.js || true

echo "[entrypoint] Starting server..."
exec node src/index.js
