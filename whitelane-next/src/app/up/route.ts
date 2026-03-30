import { NextResponse } from 'next/server';
import { isSupabaseJsConfigured } from '@/lib/supabase/config';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json(
    { status: 'ok', supabase_js: isSupabaseJsConfigured() },
    { status: 200 },
  );
}
