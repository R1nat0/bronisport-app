import 'dotenv/config';
import { prisma } from '../prisma.js';

const today = new Date().toISOString().slice(0, 10);

const { count } = await prisma.booking.updateMany({
  where: {
    status: 'confirmed',
    date: { lt: today },
  },
  data: { status: 'completed' },
});

console.log(`[complete-bookings] ${count} booking(s) moved confirmed → completed (before ${today})`);
await prisma.$disconnect();
