# Whitelane Driver API

Production driver JSON API: **[whitelane-next/](whitelane-next/)** (**Next.js** + **Supabase**). Same routes as documented in [docs/API_REFERENCE.md](docs/API_REFERENCE.md): **`/v1/*`**, **`GET /up`**, Sanctum-style tokens.

**No public self-registration** — create drivers in Supabase (seed SQL / dashboard) or your own tooling.

## Quick start (Next.js + Supabase)

```bash
cd whitelane-next
cp .env.example .env
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

# Supabase → SQL Editor: run whitelane-next/supabase/schema.sql once

npm install
npm run db:seed
npm run dev
```

Open `http://localhost:3000/up` and use `http://localhost:3000/v1` as the API base.

**Demo driver (after seed):** `driver1` / `password` (same identifiers as the old Laravel seed).

Details: [whitelane-next/README.md](whitelane-next/README.md) (env vars, RLS, **curl** smoke tests).

## Deploy (Vercel)

1. Connect this Git repo to Vercel.
2. Set **Root Directory** to **`whitelane-next`** (required — the repo root is not a Next app).
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
4. Run **`whitelane-next/supabase/schema.sql`** in Supabase before traffic.

**Preview deployments:** Vercel Deployment Protection may block anonymous `curl`; use production, a bypass token, or see [whitelane-next/README.md](whitelane-next/README.md).

## Flutter app

`API_BASE_URL` must end with `/v1`, e.g. `https://your-host/v1`.

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com/v1
```

## Documentation

| Document | Purpose |
|----------|---------|
| [whitelane-next/README.md](whitelane-next/README.md) | Next.js env, Supabase setup, curl tests |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Endpoints and payloads |
| [docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md) | Servers, ops (includes optional **Laravel** Docker / Render / Fly) |
| [docs/SYSTEM_ANALYSIS.md](docs/SYSTEM_ANALYSIS.md) | Actors, RBAC |

## Optional: Laravel codebase in this repo

The **`app/`**, **`routes/`**, **`database/`**, etc. tree is a **legacy Laravel 13** implementation of the same API. It is **not** used for the recommended Vercel deployment above. To run it locally: `composer install`, `cp .env.example .env`, `php artisan key:generate`, migrate/seed, `php artisan serve`.

## Production checklist (Next + Supabase)

- Supabase: schema applied, RLS off (or policies) for Whitelane tables as in `supabase/schema.sql`
- Vercel: correct **Root Directory** (`whitelane-next`) and both `NEXT_PUBLIC_*` variables
- Set `WHITELANE_OTP_FALLBACK_TO_PASSWORD=false` when real OTP is implemented

## License

MIT (same as Laravel skeleton). Proprietary business logic remains yours.
