import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';
import { prisma } from '../prisma.js';
import { badRequest, unauthorized } from '../utils/httpError.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM || 'BroniSport <onboarding@resend.dev>';
const CODE_TTL_MIN = 15;

function generateCode() {
  return crypto.randomInt(100_000, 999_999).toString();
}

export async function requestReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.passwordReset.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.passwordReset.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000),
    },
  });

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Код восстановления пароля — BroniSport',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
        <h2 style="color:#001c03;margin:0 0 16px">Восстановление пароля</h2>
        <p style="color:#555;font-size:14px">Ваш код подтверждения:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f0fdf0;border-radius:12px;color:#001c03">
          ${code}
        </div>
        <p style="color:#999;font-size:12px;margin-top:16px">Код действителен ${CODE_TTL_MIN} минут. Если вы не запрашивали восстановление — проигнорируйте это письмо.</p>
      </div>
    `,
  });
}

export async function verifyCode(email, code) {
  const resets = await prisma.passwordReset.findMany({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (resets.length === 0) {
    throw badRequest('Код недействителен или истёк');
  }

  const record = resets[0];
  const valid = await bcrypt.compare(code, record.codeHash);
  if (!valid) {
    throw badRequest('Неверный код');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = await bcrypt.hash(resetToken, 10);

  await prisma.passwordReset.update({
    where: { id: record.id },
    data: { used: true, codeHash: resetTokenHash },
  });

  return resetToken;
}

export async function resetPassword(email, resetToken, newPassword) {
  const records = await prisma.passwordReset.findMany({
    where: { email, used: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (records.length === 0) {
    throw unauthorized('Недействительный запрос');
  }

  const record = records[0];
  const valid = await bcrypt.compare(resetToken, record.codeHash);
  if (!valid) {
    throw unauthorized('Недействительный или уже использованный токен');
  }

  const elapsed = Date.now() - record.expiresAt.getTime();
  if (elapsed > 15 * 60 * 1000) {
    throw badRequest('Время на сброс истекло');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.passwordReset.update({
    where: { id: record.id },
    data: { codeHash: 'used' },
  });

  const { passwordHash: _, ...publicUser } = user;
  const payload = { sub: user.id, role: user.role, email: user.email };
  return {
    user: publicUser,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}
