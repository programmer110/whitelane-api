/** Supabase project URL (no trailing slash). */
export function getSupabaseUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!u) return undefined;
  return u.replace(/\/+$/, '');
}

/**
 * Publishable (anon) key — same role as the legacy `anon` JWT for the JS client.
 * Accepts dashboard-style `NEXT_PUBLIC_SUPABASE_ANON_KEY` when the newer name is unset
 * (common when wiring Vercel or copying Supabase’s default env snippet).
 */
export function getSupabasePublishableKey(): string | undefined {
  const k =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return k || undefined;
}

/**
 * True when the app has enough config to reach Supabase from the server (`/up`).
 * Counts either a publishable key or a server-only service role key.
 */
export function isSupabaseJsConfigured(): boolean {
  return Boolean(getSupabaseUrl() && (getSupabasePublishableKey() || getSupabaseServiceRoleKey()));
}

/** Server-only; never prefix with NEXT_PUBLIC. Full access — use only in API routes / scripts. */
export function getSupabaseServiceRoleKey(): string | undefined {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return k || undefined;
}

/**
 * Prefer service role in API routes so Vercel works even if anon GRANTs were not applied;
 * fall back to publishable key for local dev.
 */
export function getSupabaseKeyForApiRoutes(): string | undefined {
  return getSupabaseServiceRoleKey() || getSupabasePublishableKey();
}

export function requireSupabaseEnv(): { url: string; publishableKey: string } {
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();
  if (!url || !publishableKey) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    );
  }
  return { url, publishableKey };
}
