# Whitelane Driver API — Next.js (Vercel-native)

Same JSON API as the Laravel app (`/v1/*`, `GET /up`), implemented with **Next.js App Router** + **Prisma** + **PostgreSQL** (e.g. **Supabase**).

## Requirements

- Node.js 24.x (matches Vercel’s supported runtime; see `engines` in `package.json`)
- A **PostgreSQL** database — [Supabase](https://supabase.com) is a good default for Vercel.

## Setup

1. Create a Supabase project (or any Postgres). Copy the **connection string** (URI) from **Project Settings → Database**.

2. Configure the app:

```bash
cd whitelane-next
cp .env.example .env
# Set DATABASE_URL to your Postgres URI (see comments in .env.example)
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

`db push` applies the Prisma schema to an empty database. If you already have Laravel-managed tables on the same Postgres instance, align migrations instead of blind `db push`, or use a dedicated schema/database for the Next app.

**Pooler vs direct:** For Vercel/serverless, Supabase’s **Transaction** pooler URL often includes `?pgbouncer=true`. If migrations fail through the pooler, run `prisma db push` or `migrate deploy` using the **direct** connection string (port `5432`) from your machine or CI.

## URLs

- Local: `http://localhost:3000/v1/...`, `http://localhost:3000/up`
- Flutter: `API_BASE_URL=https://<host>/v1`

## Supabase JS client

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (publishable / anon-equivalent key from the Supabase dashboard). Helpers in `src/lib/supabase/`:

| Export | Use case |
|--------|----------|
| `createSupabaseBrowserClient()` | Client Components (`'use client'`) |
| `createSupabaseServerClient()` | Server Components / Route Handlers (cookie session) |
| `createSupabaseRouteClient()` | API routes — stateless anon client, no cookies |

Driver API data still goes through **Prisma** + `DATABASE_URL`. The JS client is for **Auth**, **Storage**, **Realtime**, and other Supabase APIs.

`GET /up` includes `supabase_js: true` when both public env vars are set.

## Behaviour notes

- **Sanctum-compatible** tokens (`id|secret`) and refresh rows when the DB matches Laravel’s schema.
- **OTP** without Redis: same as Laravel — use `WHITELANE_OTP_FALLBACK_TO_PASSWORD` for dev-style password-as-OTP.

## License

MIT (align with parent project).
