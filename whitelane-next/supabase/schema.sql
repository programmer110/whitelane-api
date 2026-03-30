-- Whitelane driver API tables. Run once in Supabase → SQL Editor (new project or empty public schema).
-- After this, run grants below if PostgREST returns "permission denied" for the publishable (anon) key.

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  password TEXT NOT NULL,
  remember_token TEXT,
  phone TEXT UNIQUE,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'driver',
  must_reset_password BOOLEAN NOT NULL DEFAULT FALSE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  last_lat DECIMAL(10, 7),
  last_lng DECIMAL(10, 7),
  account_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id BIGSERIAL PRIMARY KEY,
  tokenable_type TEXT NOT NULL,
  tokenable_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  abilities JSONB,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_type_tokenable_id_idx
  ON personal_access_tokens (tokenable_type, tokenable_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id BIGSERIAL PRIMARY KEY,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ(6) NOT NULL,
  customer_display_name TEXT NOT NULL,
  vehicle_type_label TEXT NOT NULL DEFAULT 'Standard',
  segment VARCHAR(8) NOT NULL DEFAULT 'b2c',
  driver_status VARCHAR(40) NOT NULL DEFAULT 'offered',
  payment_paid BOOLEAN NOT NULL DEFAULT FALSE,
  driver_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
  pickup_lat DECIMAL(10, 7),
  pickup_lng DECIMAL(10, 7),
  dropoff_lat DECIMAL(10, 7),
  dropoff_lng DECIMAL(10, 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publishable key → PostgREST role `anon`. Row Level Security blocks anon unless policies exist.
-- These are Laravel-parity tables (not Supabase Auth); disable RLS so seed + API work.
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personal_access_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips DISABLE ROW LEVEL SECURITY;

-- Allow the Supabase Data API (publishable / anon JWT) to read/write these tables from your Next.js server.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Make the REST API pick up new tables/columns immediately (fixes PGRST205 after first deploy).
NOTIFY pgrst, 'reload schema';
