import { prisma } from '../prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError.js';

function parseHhmm(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}
function formatHhmm(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export async function createOwnerBooking(ownerId, { facilityId, date, startTime, duration = 1, guestName, guestPhone }) {
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { id: true, ownerId: true, openTime: true, closeTime: true, pricePerHour: true, status: true },
  });
  if (!facility) throw notFound('Facility not found');
  if (facility.ownerId !== ownerId) throw forbidden('Not your facility');

  if (duration < 1 || duration > 4 || !Number.isInteger(duration)) {
    throw badRequest('duration must be 1–4');
  }

  const startMin = parseHhmm(startTime);
  const endMin = startMin + duration * 60;
  const openMin = parseHhmm(facility.openTime);
  const closeMin = parseHhmm(facility.closeTime);

  if (startMin < openMin || endMin > closeMin) {
    throw badRequest(`Time outside working hours (${facility.openTime}–${facility.closeTime})`);
  }
  if (startMin % 60 !== 0) throw badRequest('startTime must be on the hour');

  const bookingDate = new Date(`${date}T${startTime}:00`);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  if (bookingDate.getTime() > maxDate.getTime()) {
    throw badRequest('Cannot book more than 2 weeks ahead');
  }

  const endTime = formatHhmm(endMin);

  const overlapping = await prisma.booking.count({
    where: {
      facilityId, date,
      status: { in: ['pending', 'confirmed'] },
      NOT: { OR: [{ startTime: { gte: endTime } }, { endTime: { lte: startTime } }] },
    },
  });
  if (overlapping > 0) throw conflict('One or more slots already booked');

  return prisma.booking.create({
    data: {
      facilityId, date, startTime, endTime,
      status: 'confirmed',
      totalPrice: facility.pricePerHour * duration,
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      createdBy: 'organizer',
    },
    include: {
      facility: { select: { id: true, name: true } },
    },
  });
}

export async function listOwnerBookings(ownerId, { facilityId, status, from, to }) {
  const where = {
    facility: { ownerId },
    ...(facilityId && { facilityId }),
    ...(status && { status }),
    ...((from || to) && {
      date: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
  };
  return prisma.booking.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      facility: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });
}

async function loadOwnedBooking(ownerId, bookingId) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { facility: { select: { ownerId: true } } },
  });
  if (!b) throw notFound('Booking not found');
  if (b.facility.ownerId !== ownerId) throw forbidden('Not your facility booking');
  return b;
}

export async function updateBookingStatus(ownerId, bookingId, nextStatus) {
  const booking = await loadOwnedBooking(ownerId, bookingId);
  const allowed = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['cancelled', 'completed'],
    cancelled: [],
    completed: [],
  };
  if (!allowed[booking.status].includes(nextStatus)) {
    throw badRequest(`Cannot transition ${booking.status} -> ${nextStatus}`);
  }
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: nextStatus },
    include: {
      user: { select: { id: true, name: true, email: true } },
      facility: { select: { id: true, name: true } },
    },
  });
}

export async function getOwnerStats(ownerId) {
  const [facilitiesCount, approvedCount, pendingCount, bookings] = await Promise.all([
    prisma.facility.count({ where: { ownerId } }),
    prisma.facility.count({ where: { ownerId, isApproved: true } }),
    prisma.facility.count({ where: { ownerId, isApproved: false } }),
    prisma.booking.findMany({
      where: { facility: { ownerId } },
      select: { status: true, totalPrice: true, date: true },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  let totalRevenue = 0;
  let upcomingBookings = 0;
  const byStatus = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };

  for (const b of bookings) {
    byStatus[b.status] += 1;
    if (b.status === 'confirmed' || b.status === 'completed') totalRevenue += b.totalPrice;
    if (b.status === 'confirmed' && b.date >= today) upcomingBookings += 1;
  }

  return {
    facilities: { total: facilitiesCount, approved: approvedCount, pending: pendingCount },
    bookings: { total: bookings.length, upcoming: upcomingBookings, ...byStatus },
    totalRevenue,
  };
}
