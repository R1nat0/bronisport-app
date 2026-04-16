import { prisma } from '../prisma.js';
import { forbidden, notFound } from '../utils/httpError.js';
import { deleteFromS3 } from '../middleware/upload.js';

function moderationStatus(f) {
  if (f.isApproved) return 'approved';
  if (f.rejectionReason) return 'rejected';
  return 'pending';
}

function enrich(f) {
  if (!f) return f;
  return { ...f, moderationStatus: moderationStatus(f) };
}

export async function listMyFacilities(ownerId) {
  const rows = await prisma.facility.findMany({
    where: { ownerId },
    include: {
      photos: { orderBy: { order: 'asc' } },
      courts: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(enrich);
}

export async function getMyFacility(ownerId, id) {
  const f = await prisma.facility.findFirst({
    where: { id, ownerId },
    include: {
      photos: { orderBy: { order: 'asc' } },
      courts: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!f) throw notFound('Facility not found');
  return enrich(f);
}

export async function createFacility(ownerId, data) {
  const created = await prisma.facility.create({
    data: {
      ownerId,
      name: data.name,
      sport: data.sport,
      city: data.city,
      district: data.district,
      address: data.address,
      description: data.description ?? '',
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      pricePerHour: data.pricePerHour,
      openTime: data.openTime ?? '08:00',
      closeTime: data.closeTime ?? '22:00',
      status: 'active',
      isApproved: false,
      courts: { create: [{ name: 'Основной зал' }] },
    },
    include: {
      photos: true,
      courts: { select: { id: true, name: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  return enrich(created);
}

async function assertOwnership(ownerId, facilityId) {
  const f = await prisma.facility.findUnique({ where: { id: facilityId }, select: { id: true, ownerId: true } });
  if (!f) throw notFound('Facility not found');
  if (f.ownerId !== ownerId) throw forbidden('Not your facility');
  return f;
}

export async function updateFacility(ownerId, id, data) {
  await assertOwnership(ownerId, id);
  const updated = await prisma.facility.update({
    where: { id },
    data,
    include: { photos: { orderBy: { order: 'asc' } } },
  });
  return enrich(updated);
}

export async function deleteFacility(ownerId, id) {
  await assertOwnership(ownerId, id);
  await prisma.facility.delete({ where: { id } });
  return { ok: true };
}

export async function addPhotos(ownerId, id, urls) {
  await assertOwnership(ownerId, id);
  const existing = await prisma.facilityPhoto.count({ where: { facilityId: id } });
  await prisma.facilityPhoto.createMany({
    data: urls.map((url, idx) => ({ facilityId: id, url, order: existing + idx })),
  });
  return prisma.facilityPhoto.findMany({
    where: { facilityId: id },
    orderBy: { order: 'asc' },
  });
}

export async function deletePhoto(ownerId, facilityId, photoId) {
  await assertOwnership(ownerId, facilityId);
  const photo = await prisma.facilityPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.facilityId !== facilityId) throw notFound('Photo not found');
  await prisma.facilityPhoto.delete({ where: { id: photoId } });
  await deleteFromS3(photo.url);
  return { ok: true };
}
