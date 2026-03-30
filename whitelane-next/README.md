# Whitelane Driver API — Next.js (Vercel-native)

Same JSON API as the Laravel app (`/v1/*`, `GET /up`), implemented with **Next.js App Router** + **Supabase JS** (PostgREST). **No `DATABASE_URL`** — the server talks to Postgres through Supabase’s HTTP API using your **publishable** key.

## Requirements

- Node.js 20+ (repo targets **24.x** on Vercel; see `engines` in `package.json`)
- A **Supabase** project

## Environment variables

| Variable | Purpose |
|----------|---------|
| **`NEXT_PUBLIC_SUPABASE_URL`** | Project URL, e.g. `https://xxxx.supabase.co` |
| **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`** | Publishable (anon-equivalent) key from **Project Settings → API** |

Optional: `WHITELANE_OTP_FALLBACK_TO_PASSWORD`, `SANCTUM_TOKEN_PREFIX` (see below).

## Setup

1. In Supabase → **SQL Editor**, run **`supabase/schema.sql`** (creates tables + grants + `NOTIFY pgrst, 'reload schema'`). **Required before `db:seed`** — skipping this causes PostgREST error **PGRST205** (“Could not find the table `public.users`”).

2. Configure the app:

```bash
cd whitelane-next
cp .env.example .env
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
npm install
npm run db:seed
npm run dev
```

`db:seed` loads `.env` via Node’s `--env-file` (Node 20+). If that fails, export the two `NEXT_PUBLIC_*` variables manually, then run `npx tsx scripts/seed-supabase.ts`.

### If you see `permission denied` or RLS error **42501**

Supabase may enable **RLS** on `public.users` (e.g. if the table was created in the Table Editor). The schema script now runs **`ALTER TABLE … DISABLE ROW LEVEL SECURITY`** on the four Whitelane tables so the publishable key can read/write them.

If you already applied an older `schema.sql`, run the **DISABLE ROW LEVEL SECURITY** block (and `NOTIFY pgrst, 'reload schema';`) from the current `supabase/schema.sql`, or use the snippet printed by `npm run db:seed` when it detects 42501.

## Supabase JS helpers (`src/lib/supabase/`)

| Export | Use case |
|--------|----------|
| `createSupabaseBrowserClient()` | Client Components (`'use client'`) |
| `createSupabaseServerClient()` | Server Components / Route Handlers (cookies) |
| `createSupabaseRouteClient()` | API routes — same client used for all `/v1` DB access |

## URLs

- Local: `http://localhost:3000/v1/...`, `http://localhost:3000/up`
- Flutter: `API_BASE_URL=https://<host>/v1`

`GET /up` returns `supabase_js: true` when both public env vars are set.

## Smoke test with curl

Replace `BASE` with your deployment origin (no trailing slash). For **password-protected** Vercel previews, add `?x-vercel-protection-bypass=YOUR_TOKEN&x-vercel-set-bypass-cookie=true` or use production.

```bash
BASE=http://localhost:3000   # or https://your-app.vercel.app

curl -sS "$BASE/up"
echo

curl -sS -X POST "$BASE/v1/auth/driver/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"driver1","secret":"password","mode":"password"}'
echo
```

Automated scripts (with **`npm run dev`** or **`npm run start`** running):

```bash
./scripts/curl-smoke.sh http://localhost:3000
./scripts/curl-api-test.sh http://localhost:3000   # full suite

# Vercel preview URL with Deployment Protection — add bypass token from project settings:
VERCEL_PROTECTION_BYPASS='your_bypass_secret' ./scripts/curl-api-test.sh https://your-app-git-main-xxx.vercel.app
```

If `curl` returns HTML titled **Authentication Required**, that is **Vercel’s wall**, not this API. Disable preview protection, use production URL, or pass `VERCEL_PROTECTION_BYPASS` as above.

## Behaviour notes

- **Sanctum-compatible** tokens (`id|secret`) and refresh rows in `personal_access_tokens` / `refresh_tokens`.
- **OTP** without Redis: `WHITELANE_OTP_FALLBACK_TO_PASSWORD` (same as Laravel).

## License

MIT (align with parent project).
