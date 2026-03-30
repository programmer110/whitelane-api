/**
 * Seed demo data via Supabase JS (same as Laravel DatabaseSeeder).
 * Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

function loadEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
    process.exit(1);
  }
  return { url, key };
}

function printRlsDeniedHelp() {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PostgreSQL 42501 — row-level security blocked the insert on "users".

Run this in Supabase → SQL Editor (then NOTIFY below):

  ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.personal_access_tokens DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.refresh_tokens DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
  NOTIFY pgrst, 'reload schema';

Or re-run the full updated whitelane-next/supabase/schema.sql (includes the above).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

function printSchemaMissingHelp() {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PostgREST error PGRST205 — table "public.users" is not visible to the Data API.

This almost always means the Whitelane tables were not created yet, or the API
schema cache was not refreshed after you ran SQL.

Fix (once per project):
  1. Supabase Dashboard → your project → SQL Editor → New query
  2. Open this file in your repo and paste its entire contents:
       whitelane-next/supabase/schema.sql
  3. Run the query (creates tables, grants, and NOTIFY pgrst, 'reload schema')
  4. Wait a few seconds, then run:  npm run db:seed

If tables already exist but you still see PGRST205, run only this in SQL Editor:
       NOTIFY pgrst, 'reload schema';
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

async function assertUsersTableReachable(supabase: SupabaseClient) {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (!error) return;
  if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
    printSchemaMissingHelp();
    process.exit(1);
  }
  throw error;
}

async function main() {
  const { url, key } = loadEnv();
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await assertUsersTableReachable(supabase);

  const passwordHash = bcrypt.hashSync('password', 12);
  const now = new Date().toISOString();

  const { data: driver, error: dErr } = await supabase
    .from('users')
    .upsert(
      {
        name: 'Demo Driver',
        email: 'driver@whitelane.local',
        username: 'driver1',
        phone: '+10000000001',
        role: 'driver',
        must_reset_password: false,
        account_status: 'active',
        password: passwordHash,
        updated_at: now,
      },
      { onConflict: 'email' },
    )
    .select('id')
    .single();
  if (dErr) {
    if (dErr.code === 'PGRST205') {
      printSchemaMissingHelp();
      process.exit(1);
    }
    if (dErr.code === '42501' || dErr.message?.includes('row-level security')) {
      printRlsDeniedHelp();
      process.exit(1);
    }
    throw dErr;
  }
  if (!driver) throw new Error('driver upsert returned no row');

  const { error: aErr } = await supabase.from('users').upsert(
    {
      name: 'Admin',
      email: 'admin@whitelane.local',
      username: 'admin1',
      role: 'admin',
      password: passwordHash,
      account_status: 'active',
      updated_at: now,
    },
    { onConflict: 'email' },
  );
  if (aErr) {
    if (aErr.code === 'PGRST205') {
      printSchemaMissingHelp();
      process.exit(1);
    }
    if (aErr.code === '42501' || aErr.message?.includes('row-level security')) {
      printRlsDeniedHelp();
      process.exit(1);
    }
    throw aErr;
  }

  const driverId = String((driver as { id: unknown }).id);
  const { error: delErr } = await supabase.from('trips').delete().eq('driver_id', driverId);
  if (delErr) throw delErr;

  const in2h = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const in1d = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const { error: tErr } = await supabase.from('trips').insert([
    {
      pickup_address: 'King Fahd Rd, Riyadh',
      dropoff_address: 'Olaya St, Riyadh',
      scheduled_at: in2h,
      customer_display_name: 'Customer A',
      vehicle_type_label: 'Sedan',
      segment: 'b2c',
      driver_status: 'offered',
      payment_paid: true,
      driver_id: driverId,
      pickup_lat: 24.7136,
      pickup_lng: 46.6753,
      dropoff_lat: 24.75,
      dropoff_lng: 46.7,
    },
    {
      pickup_address: 'Airport T1',
      dropoff_address: 'Business District',
      scheduled_at: in1d,
      customer_display_name: 'Customer B',
      vehicle_type_label: 'SUV',
      segment: 'b2b',
      driver_status: 'assigned',
      payment_paid: true,
      driver_id: driverId,
      pickup_lat: 24.96,
      pickup_lng: 46.6989,
      dropoff_lat: 24.72,
      dropoff_lng: 46.68,
    },
  ]);
  if (tErr) throw tErr;

  console.log('Seeded: demo driver (driver1 / password), admin, 2 trips.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
