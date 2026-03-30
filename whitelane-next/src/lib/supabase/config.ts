/** Supabase project URL (no trailing slash). */
export function getSupabaseUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!u) return undefined;
  return u.replace(/\/+$/, '');
}

/**
 * Publishable (anon) key — same role as the legacy `anon` JWT for the JS client.
 * Env name matches Supabase dashboard / your `.env`.
 */
export function getSupabasePublishableKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  return k || undefined;
}

export function isSupabaseJsConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function requireSupabaseEnv(): { url: string; publishableKey: string } {
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();
  if (!url || !publishableKey) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    );
  }
  return { url, publishableKey };
}
