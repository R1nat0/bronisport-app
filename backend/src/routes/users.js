import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    avatar: z.string().url().max(500).optional().or(z.literal('')),
    phone: z.string().trim().max(40).optional().or(z.literal('')),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Empty patch' });

router.patch('/me', requireAuth, validateBody(patchSchema), async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body,
    });
    const { passwordHash, ...publicUser } = updated;
    res.json({ user: publicUser });
  } catch (err) {
    next(err);
  }
});

export default router;
