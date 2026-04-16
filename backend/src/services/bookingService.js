import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';

const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000;

function parseHhmm(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function formatHhmm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function bookingDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

export async function createBooking({ userId, courtId, date, startTime, duration = 1 }) {
  if (duration < 1 || duration > 4 || !Number.isInteger(duration)) {
    throw badRequest('duration must be 1–4 hours');
  }

  const court = await prisma.court.findUnique({
    where: { id: courtId },
    include: {
      facility: {
        select: { id: true, isApproved: true, status: true, openTime: true, closeTime: true, pricePerHour: true },
      },
    },
  });
  if (!court || !court.facility.isApproved || court.facility.status !== 'active') {
    throw notFound('Court not found');
  }

  const { facility } = court;
  const startMin = parseHhmm(startTime);
  const endMin = startMin + duration * 60;
  const openMin = parseHhmm(facility.openTime);
  const closeMin = parseHhmm(facility.closeTime);

  if (startMin < openMin || endMin > closeMin) {
    throw badRequest(`Time outside working hours (${facility.openTime}–${facility.closeTime})`);
  }
  if (startMin % 60 !== 0) throw badRequest('startTime must be on the hour');

  const start = bookingDateTime(date, startTime);
  if (Number.isNaN(start.getTime())) throw badRequest('Invalid date/time');
  if (start.getTime() < Date.now()) throw badRequest('Cannot book in the past');
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  if (start.getTime() > maxDate.getTime()) throw badRequest('Cannot book more than 2 weeks ahead');

  const endTime = formatHhmm(endMin);

  const overlapping = await prisma.booking.count({
    where: {
      courtId,
      date,
      status: { in: ['pending', 'confirmed'] },
      NOT: { OR: [{ startTime: { gte: endTime } }, { endTime: { lte: startTime } }] },
    },
  });
  if (overlapping > 0) throw conflict('One or more slots already booked');

  try {
    return await prisma.booking.create({
      data: {
        userId,
        facilityId: facility.id,
        courtId,
        date,
        startTime,
        endTime,
        status: 'confirmed',
        totalPrice: facility.pricePerHour * duration,
      },
      include: {
        facility: { select: { id: true, name: true, city: true, address: true } },
        court: { select: { id: true, name: true } },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw conflict('Slot already booked');
    }
    throw err;
  }
}

export async function listMyBookings({ userId, status }) {
  const where = { userId, ...(status && { status }) };
  return prisma.booking.findMany({
    where,
    include: {
      facility: {
        select: {
          id: true, name: true, city: true, address: true,
          photos: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
        },
      },
      court: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });
}

export async function cancelBooking({ userId, bookingId }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw notFound('Booking not found');
  if (booking.userId !== userId) throw forbidden('Not your booking');
  if (booking.status === 'cancelled') throw badRequest('Already cancelled');
  if (booking.status === 'completed') throw badRequest('Cannot cancel a completed booking');

  const start = bookingDateTime(booking.date, booking.startTime);
  if (start.getTime() - Date.now() < CANCEL_CUTOFF_MS) {
    throw badRequest('Cancellation window closed (less than 2 hours before start)');
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'cancelled' },
  });
}
