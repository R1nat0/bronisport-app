import { prisma } from '../prisma.js';
import { notFound } from '../utils/httpError.js';

function publicFacility(f) {
  if (!f) return f;
  const { ownerId, rejectionReason, approvedBy, approvedAt, isApproved, ...rest } = f;
  return rest;
}

export async function listFacilities({ city, sport, district, minPrice, maxPrice, search, page, limit }) {
  const where = {
    isApproved: true,
    status: 'active',
    ...(city && { city }),
    ...(sport && { sport }),
    ...(district && { district }),
    ...((minPrice != null || maxPrice != null) && {
      pricePerHour: {
        ...(minPrice != null && { gte: minPrice }),
        ...(maxPrice != null && { lte: maxPrice }),
      },
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [total, rows] = await Promise.all([
    prisma.facility.count({ where }),
    prisma.facility.findMany({
      where,
      include: {
        photos: { orderBy: { order: 'asc' } },
        courts: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: rows.map((f) => ({ ...publicFacility(f), courtsCount: f.courts?.length ?? 0 })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFacilityById(id) {
  const facility = await prisma.facility.findFirst({
    where: { id, isApproved: true, status: 'active' },
    include: {
      photos: { orderBy: { order: 'asc' } },
      courts: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
      owner: { select: { id: true, name: true } },
    },
  });
  if (!facility) throw notFound('Facility not found');
  return publicFacility(facility);
}

function isValidDateYmd(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
}

function parseHhmm(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function formatHhmm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getCourtSlots(courtId, date) {
  if (!isValidDateYmd(date)) throw notFound('Invalid date');

  const court = await prisma.court.findUnique({
    where: { id: courtId },
    include: {
      facility: {
        select: { id: true, openTime: true, closeTime: true, pricePerHour: true, isApproved: true, status: true },
      },
    },
  });
  if (!court || !court.facility.isApproved || court.facility.status !== 'active') {
    throw notFound('Court not found');
  }

  const { openTime, closeTime, pricePerHour } = court.facility;
  const openMin = parseHhmm(openTime);
  const closeMin = parseHhmm(closeTime);

  const bookings = await prisma.booking.findMany({
    where: {
      courtId,
      date,
      status: { in: ['pending', 'confirmed'] },
    },
    select: { startTime: true, endTime: true },
  });

  const bookedRanges = bookings.map((b) => [parseHhmm(b.startTime), parseHhmm(b.endTime)]);

  function isSlotTaken(slotStart) {
    const slotEnd = slotStart + 60;
    return bookedRanges.some(([bStart, bEnd]) => bStart < slotEnd && bEnd > slotStart);
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMin = date === todayStr ? now.getHours() * 60 + now.getMinutes() : -1;

  const slots = [];
  for (let t = openMin; t + 60 <= closeMin; t += 60) {
    const time = formatHhmm(t);
    const inPast = t <= nowMin;
    slots.push({ time, available: !inPast && !isSlotTaken(t) });
  }

  return { courtId, facilityId: court.facilityId, date, pricePerHour, slots };
}
