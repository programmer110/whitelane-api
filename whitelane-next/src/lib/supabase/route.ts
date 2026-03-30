import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseKeyForApiRoutes,
  getSupabaseUrl,
} from './config';

/**
 * Stateless Supabase client for API routes.
 * Uses `SUPABASE_SERVICE_ROLE_KEY` when set (recommended on Vercel); otherwise the publishable key.
 * With the publishable key, table access needs GRANTs (see `supabase/schema.sql`).
 */
export function createSupabaseRouteClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKeyForApiRoutes();
  if (!url || !key) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and one of: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
