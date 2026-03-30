import crypto from 'crypto';
import type { User } from '@/lib/db/types';
import { rowToPat, rowToUser } from '@/lib/db/mappers';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { generateTokenString, sha256Hex, TOKENABLE_TYPE } from '@/lib/sanctum-token';

const ACCESS_NAME = 'driver-app';

export function otpFallbackToPassword(): boolean {
  const v = process.env.WHITELANE_OTP_FALLBACK_TO_PASSWORD;
  if (v === undefined || v === '') return true;
  return v === 'true' || v === '1';
}

export async function issuePair(user: User) {
  const supabase = createSupabaseRouteClient();
  const uid = user.id.toString();

  const { error: delPatErr } = await supabase
    .from('personal_access_tokens')
    .delete()
    .eq('tokenable_type', TOKENABLE_TYPE)
    .eq('tokenable_id', uid);
  if (delPatErr) throw delPatErr;

  const { error: delRtErr } = await supabase.from('refresh_tokens').delete().eq('user_id', uid);
  if (delRtErr) throw delRtErr;

  const plainSecret = generateTokenString(process.env.SANCTUM_TOKEN_PREFIX ?? '');
  const tokenHash = sha256Hex(plainSecret);
  const expiresAt = new Date(Date.now() + 3600 * 1000);

  const { data: patRow, error: patInsErr } = await supabase
    .from('personal_access_tokens')
    .insert({
      tokenable_type: TOKENABLE_TYPE,
      tokenable_id: uid,
      name: ACCESS_NAME,
      token: tokenHash,
      abilities: ['driver'],
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();
  if (patInsErr || !patRow) throw patInsErr ?? new Error('personal_access_tokens insert failed');

  const plainRefresh = crypto.randomBytes(48).toString('base64url');
  const refreshHash = sha256Hex(plainRefresh);

  const { error: rtErr } = await supabase.from('refresh_tokens').insert({
    user_id: uid,
    token_hash: refreshHash,
    expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  });
  if (rtErr) throw rtErr;

  return {
    access_token: `${String(patRow.id)}|${plainSecret}`,
    refresh_token: plainRefresh,
    expires_in: 3600,
  };
}

export async function refreshWithPlain(plainRefresh: string) {
  const supabase = createSupabaseRouteClient();
  const hash = sha256Hex(plainRefresh);
  const nowIso = new Date().toISOString();

  const { data: row, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token_hash', hash)
    .gt('expires_at', nowIso)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const rt = row as Record<string, unknown>;
  const userId = String(rt.user_id);

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (userErr) throw userErr;
  if (!userRow) return null;

  const { error: delErr } = await supabase.from('refresh_tokens').delete().eq('id', String(rt.id));
  if (delErr) throw delErr;

  return issuePair(rowToUser(userRow as Record<string, unknown>));
}

export async function revokeAll(user: User) {
  const supabase = createSupabaseRouteClient();
  const uid = user.id.toString();

  const { error: e1 } = await supabase
    .from('personal_access_tokens')
    .delete()
    .eq('tokenable_type', TOKENABLE_TYPE)
    .eq('tokenable_id', uid);
  if (e1) throw e1;

  const { error: e2 } = await supabase.from('refresh_tokens').delete().eq('user_id', uid);
  if (e2) throw e2;
}

/** Sanctum PersonalAccessToken::findToken */
export async function findUserFromBearer(authorization: string | null): Promise<User | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const raw = authorization.slice(7).trim();
  if (!raw) return null;

  const supabase = createSupabaseRouteClient();
  let tokenRow = null;

  if (raw.includes('|')) {
    const [idStr, secret] = raw.split('|', 2);
    let id: bigint;
    try {
      id = BigInt(idStr);
    } catch {
      return null;
    }
    const { data, error } = await supabase
      .from('personal_access_tokens')
      .select('*')
      .eq('id', id.toString())
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const tr = rowToPat(data as Record<string, unknown>);
    if (tr.token !== sha256Hex(secret)) return null;
    tokenRow = tr;
  } else {
    const { data, error } = await supabase
      .from('personal_access_tokens')
      .select('*')
      .eq('token', sha256Hex(raw))
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    tokenRow = rowToPat(data as Record<string, unknown>);
  }

  if (tokenRow.expiresAt && tokenRow.expiresAt <= new Date()) return null;
  if (tokenRow.tokenableType !== TOKENABLE_TYPE) return null;

  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', tokenRow.tokenableId.toString())
    .maybeSingle();
  if (userErr) throw userErr;
  if (!userRow) return null;

  return rowToUser(userRow as Record<string, unknown>);
}

export function tokenHasDriverAbility(abilities: unknown): boolean {
  if (!Array.isArray(abilities)) return false;
  if (abilities.includes('*')) return true;
  return abilities.includes('driver');
}
