import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { FACILITIES_SEED } from './seedFacilities.js';

const users = [
  {
    email: 'athlete@example.com',
    password: 'password123',
    name: 'Иван Петров',
    role: 'athlete',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    email: 'organizer@example.com',
    password: 'password123',
    name: 'Павел Владимиров',
    role: 'organizer',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

async function seedUsers() {
  const map = {};
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, avatar: u.avatar },
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
      },
    });
    map[u.role] = created;
    console.log(`✓ user ${u.email} (${u.role})`);
  }
  return map;
}

async function seedFacilities(owner, athlete) {
  const existing = await prisma.facility.count();
  if (existing > 0) {
    console.log(`↷ skip facilities: already have ${existing} in DB`);
    return;
  }

  for (const f of FACILITIES_SEED) {
    const created = await prisma.facility.create({
      data: {
        ownerId: owner.id,
        name: f.name,
        sport: f.sport,
        city: f.city,
        district: f.district,
        address: f.address,
        pricePerHour: f.pricePerHour,
        description: f.description,
        openTime: f.openTime,
        closeTime: f.closeTime,
        status: 'active',
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: 'seed',
        photos: {
          create: f.photos.map((url, order) => ({ url, order })),
        },
      },
    });

    if (f.reviews?.length) {
      await prisma.review.createMany({
        data: f.reviews.map((r) => ({
          facilityId: created.id,
          userId: athlete.id,
          rating: r.rating,
          text: r.text,
        })),
      });
    }
    console.log(`✓ facility ${f.name}`);
  }
}

async function main() {
  const userMap = await seedUsers();
  await seedFacilities(userMap.organizer, userMap.athlete);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
