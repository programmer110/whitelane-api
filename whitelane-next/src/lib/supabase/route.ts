import { createClient } from '@supabase/supabase-js';
import { requireSupabaseEnv } from './config';

/**
 * Stateless Supabase client for API routes — PostgREST with the publishable (anon) key.
 * Table access requires GRANTs (see supabase/schema.sql) or matching RLS policies.
 */
export function createSupabaseRouteClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
