import bcrypt from 'bcryptjs';
import type { User } from '@/lib/db/types';
import { rowToUser } from '@/lib/db/mappers';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { otpFallbackToPassword } from './auth-tokens';

async function findUserByColumn(column: 'email' | 'username' | 'phone', value: string): Promise<User | null> {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.from('users').select('*').eq(column, value).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToUser(data as Record<string, unknown>);
}

export async function resolveUser(identifier: string): Promise<User | null> {
  const trimmed = identifier.trim();
  const normalizedPhone = trimmed.replace(/\s+/g, '');

  return (
    (await findUserByColumn('email', trimmed)) ??
    (await findUserByColumn('username', trimmed)) ??
    (await findUserByColumn('phone', normalizedPhone))
  );
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
