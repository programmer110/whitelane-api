'use client';

import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseEnv } from './config';

/** Supabase client for Client Components (Auth, Realtime, Storage in the browser). */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
