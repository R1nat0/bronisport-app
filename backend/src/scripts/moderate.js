import 'dotenv/config';
import os from 'node:os';
import { prisma } from '../prisma.js';

const [, , action, ...rest] = process.argv;

function parseArgs(args) {
  const out = { positional: [], flags: {} };
  for (const a of args) {
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      out.flags[k] = v ?? true;
    } else {
      out.positional.push(a);
    }
  }
  return out;
}

async function listPending() {
  const rows = await prisma.facility.findMany({
    where: { isApproved: false, rejectionReason: null },
    include: { owner: { select: { email: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  if (rows.length === 0) {
    console.log('No facilities pending moderation.');
    return;
  }
  console.log(`Pending (${rows.length}):`);
  for (const f of rows) {
    console.log(`  - ${f.id}  "${f.name}"  ${f.city}/${f.district}  owner=${f.owner.email}  created=${f.createdAt.toISOString().slice(0, 10)}`);
  }
}

async function approve(id) {
  const actor = `${os.userInfo().username}@${os.hostname()}`;
  const existing = await prisma.facility.findUnique({ where: { id } });
  if (!existing) throw new Error(`Facility ${id} not found`);
  if (existing.isApproved) {
    console.log(`Already approved: ${id}`);
    return;
  }

  await prisma.$transaction([
    prisma.facility.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: actor,
        rejectionReason: null,
      },
    }),
    prisma.moderationLog.create({
      data: { facilityId: id, action: 'approve', actor },
    }),
  ]);
  console.log(`✓ Approved: ${existing.name} (${id})`);
}

async function reject(id, reason) {
  const actor = `${os.userInfo().username}@${os.hostname()}`;
  const existing = await prisma.facility.findUnique({ where: { id } });
  if (!existing) throw new Error(`Facility ${id} not found`);
  if (!reason) throw new Error('Rejection reason is required (--reason="...")');

  await prisma.$transaction([
    prisma.facility.update({
      where: { id },
      data: {
        isApproved: false,
        approvedAt: null,
        approvedBy: null,
        rejectionReason: reason,
      },
    }),
    prisma.moderationLog.create({
      data: { facilityId: id, action: 'reject', actor, reason },
    }),
  ]);
  console.log(`✗ Rejected: ${existing.name} (${id})\n  reason: ${reason}`);
}

async function main() {
  const { positional, flags } = parseArgs(rest);

  if (action === 'list') return listPending();
  if (action === 'approve') {
    const id = positional[0];
    if (!id) throw new Error('Usage: npm run moderate:approve -- <facilityId>');
    return approve(id);
  }
  if (action === 'reject') {
    const id = positional[0];
    if (!id) throw new Error('Usage: npm run moderate:reject -- <facilityId> --reason="..."');
    return reject(id, flags.reason);
  }
  console.log('Usage:');
  console.log('  npm run moderate:list');
  console.log('  npm run moderate:approve -- <facilityId>');
  console.log('  npm run moderate:reject  -- <facilityId> --reason="..."');
  process.exit(1);
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
