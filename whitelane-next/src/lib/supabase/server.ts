import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSupabaseEnv } from './config';

/**
 * Supabase client for Server Components / Route Handlers — uses cookies for session.
 * Use when you adopt Supabase Auth alongside cookies.
 */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // e.g. Server Component without mutable cookie store
        }
      },
    },
  });
}
