import type { User } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from './prisma';
import { generateTokenString, sha256Hex, TOKENABLE_TYPE } from './sanctum-token';

const ACCESS_NAME = 'driver-app';

export function otpFallbackToPassword(): boolean {
  const v = process.env.WHITELANE_OTP_FALLBACK_TO_PASSWORD;
  if (v === undefined || v === '') return true;
  return v === 'true' || v === '1';
}

export async function issuePair(user: User) {
  await prisma.personalAccessToken.deleteMany({
    where: { tokenableType: TOKENABLE_TYPE, tokenableId: user.id },
  });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  const plainSecret = generateTokenString(process.env.SANCTUM_TOKEN_PREFIX ?? '');
  const tokenHash = sha256Hex(plainSecret);

  const expiresAt = new Date(Date.now() + 3600 * 1000);

  const row = await prisma.personalAccessToken.create({
    data: {
      tokenableType: TOKENABLE_TYPE,
      tokenableId: user.id,
      name: ACCESS_NAME,
      token: tokenHash,
      abilities: JSON.stringify(['driver']),
      expiresAt,
    },
  });

  const plainRefresh = crypto.randomBytes(48).toString('base64url');
  const refreshHash = sha256Hex(plainRefresh);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  return {
    access_token: `${row.id}|${plainSecret}`,
    refresh_token: plainRefresh,
    expires_in: 3600,
  };
}

export async function refreshWithPlain(plainRefresh: string) {
  const hash = sha256Hex(plainRefresh);
  const row = await prisma.refreshToken.findFirst({
    where: { tokenHash: hash, expiresAt: { gt: new Date() } },
  });
  if (!row) return null;

  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return null;

  await prisma.refreshToken.delete({ where: { id: row.id } });
  return issuePair(user);
}

export async function revokeAll(user: User) {
  await prisma.personalAccessToken.deleteMany({
    where: { tokenableType: TOKENABLE_TYPE, tokenableId: user.id },
  });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
}

/** Sanctum PersonalAccessToken::findToken */
export async function findUserFromBearer(authorization: string | null): Promise<User | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const raw = authorization.slice(7).trim();
  if (!raw) return null;

  let tokenRow = null;

  if (raw.includes('|')) {
    const [idStr, secret] = raw.split('|', 2);
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) return null;
    tokenRow = await prisma.personalAccessToken.findUnique({ where: { id } });
    if (!tokenRow || tokenRow.token !== sha256Hex(secret)) return null;
  } else {
    tokenRow = await prisma.personalAccessToken.findFirst({
      where: { token: sha256Hex(raw) },
    });
    if (!tokenRow) return null;
  }

  if (tokenRow.expiresAt && tokenRow.expiresAt <= new Date()) return null;
  if (tokenRow.tokenableType !== TOKENABLE_TYPE) return null;

  return prisma.user.findUnique({ where: { id: tokenRow.tokenableId } });
}

export function tokenHasDriverAbility(abilities: unknown): boolean {
  if (!Array.isArray(abilities)) return false;
  if (abilities.includes('*')) return true;
  return abilities.includes('driver');
}
