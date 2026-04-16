import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { notFound } from '../utils/httpError.js';

export async function listMyFavorites(userId) {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      facility: {
        include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
      },
    },
  });
  return favs
    .filter((f) => f.facility.isApproved && f.facility.status === 'active')
    .map((f) => ({
      facilityId: f.facilityId,
      addedAt: f.createdAt,
      facility: {
        id: f.facility.id,
        name: f.facility.name,
        sport: f.facility.sport,
        city: f.facility.city,
        district: f.facility.district,
        address: f.facility.address,
        pricePerHour: f.facility.pricePerHour,
        photo: f.facility.photos[0]?.url ?? null,
      },
    }));
}

export async function addFavorite(userId, facilityId) {
  const facility = await prisma.facility.findFirst({
    where: { id: facilityId, isApproved: true, status: 'active' },
    select: { id: true },
  });
  if (!facility) throw notFound('Facility not found');

  try {
    await prisma.favorite.create({ data: { userId, facilityId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: true, alreadyExists: true };
    }
    throw err;
  }
  return { ok: true };
}

export async function removeFavorite(userId, facilityId) {
  const { count } = await prisma.favorite.deleteMany({ where: { userId, facilityId } });
  return { ok: true, removed: count };
}
