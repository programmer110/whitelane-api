# Whitelane Driver API

Production driver JSON API: **[whitelane-next/](whitelane-next/)** (**Next.js** + **Supabase**). Same routes as documented in [docs/API_REFERENCE.md](docs/API_REFERENCE.md): **`/v1/*`**, **`GET /up`**, Sanctum-style tokens.

**No public self-registration** — create drivers in Supabase (seed SQL / dashboard) or your own tooling.

## Quick start (Next.js + Supabase)

```bash
cd whitelane-next
cp .env.example .env
# Set NEXT_PUBLIC_SUPABASE_URL and a key: SUPABASE_SERVICE_ROLE_KEY (server, recommended on Vercel)
# or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY

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
2. **Root Directory:** leave **empty** (repo root) — **`vercel.json`** runs `npm install` at the root (so Vercel sees **`next`** in the root `package.json`) **and** `npm install` in **`whitelane-next/`**, then **`npm run build --prefix whitelane-next`**.  
   *Alternatively*, set Root Directory to **`whitelane-next`** and you can ignore the root `vercel.json` install/build overrides if Vercel picks up `whitelane-next/vercel.json` alone.
3. In Vercel → Project → Settings → **General**: if **Output Directory** is set to `dist`, **remove it** (let `vercel.json` or the Next builder control output).
4. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, and **`SUPABASE_SERVICE_ROLE_KEY`** (Supabase → Settings → API, *service_role* — server only, not `NEXT_PUBLIC_*`) **or** the publishable/anon key if you rely on `schema.sql` GRANTs.
5. Run **`whitelane-next/supabase/schema.sql`** in Supabase before traffic.

### Vercel “Authentication Required” / `curl` gets HTML instead of JSON

Branch preview URLs look like **`https://…-git-main-….vercel.app`**. If **Deployment Protection** is enabled, Vercel may return an **HTML login page**, a short **`Redirecting...`** body (redirect/cookie flow), or similar — your **Next.js API never runs**, so `/up` is not JSON and tests fail.

**Fix (pick one):**

- **Production / custom domain:** Use the **production** deployment URL (often `https://<project>.vercel.app` without `-git-main-` in the hostname), or attach a domain and test that.
- **Dashboard:** Vercel → **Project** → **Settings** → **Deployment Protection** → turn off Standard Protection for **Preview** (or only for this project), *or* keep it and use a **bypass token** (see [Protection bypass automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)).
- **Scripts:** `VERCEL_PROTECTION_BYPASS='<token>' ./whitelane-next/scripts/curl-api-test.sh https://your-preview-host.vercel.app`

See [whitelane-next/README.md](whitelane-next/README.md).

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
- Vercel: repo root + root `vercel.json`, **or** Root Directory **`whitelane-next`**; both `NEXT_PUBLIC_*` variables set
- Set `WHITELANE_OTP_FALLBACK_TO_PASSWORD=false` when real OTP is implemented

## License

MIT (same as Laravel skeleton). Proprietary business logic remains yours.
