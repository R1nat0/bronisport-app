import { prisma } from '../prisma.js';
import { notFound } from '../utils/httpError.js';

function publicFacility(f) {
  if (!f) return f;
  const { ownerId, rejectionReason, approvedBy, approvedAt, isApproved, ...rest } = f;
  return rest;
}

async function withAggregates(facilities) {
  if (facilities.length === 0) return [];
  const ids = facilities.map((f) => f.id);

  const ratings = await prisma.review.groupBy({
    by: ['facilityId'],
    where: { facilityId: { in: ids } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingMap = new Map(ratings.map((r) => [r.facilityId, r]));

  return facilities.map((f) => {
    const r = ratingMap.get(f.id);
    return {
      ...f,
      rating: r?._avg.rating ? Number(r._avg.rating.toFixed(2)) : null,
      reviewsCount: r?._count.rating ?? 0,
    };
  });
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
      include: { photos: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const enriched = await withAggregates(rows);
  return {
    items: enriched.map(publicFacility),
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
      reviews: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      owner: { select: { id: true, name: true } },
    },
  });
  if (!facility) throw notFound('Facility not found');

  const [enriched] = await withAggregates([facility]);
  return publicFacility(enriched);
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

/**
 * Вычисляем часовые слоты на дату из openTime/closeTime минус занятые брони.
 * Возвращает массив { time, available }.
 */
export async function getFacilitySlots(id, date) {
  if (!isValidDateYmd(date)) throw notFound('Invalid date');

  const facility = await prisma.facility.findFirst({
    where: { id, isApproved: true, status: 'active' },
    select: { id: true, openTime: true, closeTime: true, pricePerHour: true },
  });
  if (!facility) throw notFound('Facility not found');

  const openMin = parseHhmm(facility.openTime);
  const closeMin = parseHhmm(facility.closeTime);

  const bookings = await prisma.booking.findMany({
    where: {
      facilityId: id,
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

  return {
    facilityId: id,
    date,
    pricePerHour: facility.pricePerHour,
    slots,
  };
}
