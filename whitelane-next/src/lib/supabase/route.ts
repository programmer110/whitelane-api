import { createClient } from '@supabase/supabase-js';
import { requireSupabaseEnv } from './config';

/**
 * Stateless Supabase REST client for API routes / server jobs — no cookie session.
 * Respects RLS as the anonymous role unless you pass a user JWT.
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
