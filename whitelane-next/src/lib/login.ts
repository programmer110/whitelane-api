import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from './prisma';
import { otpFallbackToPassword } from './auth-tokens';

export async function resolveUser(identifier: string): Promise<User | null> {
  const trimmed = identifier.trim();
  const normalizedPhone = trimmed.replace(/\s+/g, '');

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: trimmed },
        { username: trimmed },
        { phone: normalizedPhone },
      ],
    },
  });
}

export async function verifySecret(user: User, secret: string, mode: 'password' | 'otp'): Promise<boolean> {
  if (mode === 'password') {
    return bcrypt.compare(secret, user.password);
  }

  if (otpFallbackToPassword()) {
    return bcrypt.compare(secret, user.password);
  }

  return false;
}
