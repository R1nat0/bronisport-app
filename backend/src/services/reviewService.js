import { prisma } from '../prisma.js';
import { forbidden, notFound } from '../utils/httpError.js';

export async function listFacilityReviews(facilityId) {
  const facility = await prisma.facility.findFirst({
    where: { id: facilityId, isApproved: true, status: 'active' },
    select: { id: true },
  });
  if (!facility) throw notFound('Facility not found');

  return prisma.review.findMany({
    where: { facilityId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Спортсмен может оставить отзыв только если у него есть ЗАВЕРШЁННАЯ бронь
 * на эту площадку. Прошлые брони конвертируются в 'completed' лениво —
 * здесь просто считаем подтверждённые брони с датой в прошлом.
 */
export async function createReview({ userId, facilityId, rating, text }) {
  const facility = await prisma.facility.findFirst({
    where: { id: facilityId, isApproved: true, status: 'active' },
    select: { id: true },
  });
  if (!facility) throw notFound('Facility not found');

  const today = new Date().toISOString().slice(0, 10);
  const hasCompleted = await prisma.booking.count({
    where: {
      userId,
      facilityId,
      OR: [
        { status: 'completed' },
        { status: 'confirmed', date: { lt: today } },
      ],
    },
  });

  if (hasCompleted === 0) {
    throw forbidden('You can review a facility only after a completed booking');
  }

  return prisma.review.create({
    data: { userId, facilityId, rating, text },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}
