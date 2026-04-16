import bcrypt from 'bcrypt';
import { prisma } from '../prisma.js';
import { conflict, unauthorized } from '../utils/httpError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const BCRYPT_COST = 12;

function toPublicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function issueTokens(user) {
  const payload = { sub: user.id, role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function register({ email, password, name, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('Email already in use');

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  });

  return { user: toPublicUser(user), ...issueTokens(user) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid credentials');

  return { user: toPublicUser(user), ...issueTokens(user) };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw unauthorized('Missing refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized('User no longer exists');

  return { user: toPublicUser(user), ...issueTokens(user) };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized('User not found');
  return toPublicUser(user);
}
