# Whitelane Driver API

Standalone **Laravel 13** JSON API for the **Whitelane Driver** mobile app (`../whitelane_driver`).  
**No public self-registration** — drivers are created in the database or via your admin tooling.

## Features

- **Sanctum** bearer tokens (short-lived access + **refresh tokens** in `refresh_tokens` table)
- **RBAC**: `driver` middleware on all `/v1/driver/*` routes; login blocked for non-drivers
- **Driver-safe trip payloads** — no fare, payment line items, or invoices in JSON
- **Business rules**: trips require `payment_paid` for driver visibility and completion
- **Routes** under **`/v1`** (matches Flutter `API_BASE_URL` ending in `/v1`)

## Quick start (local)

```bash
cd whitelane-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

**Demo driver (after seed):**

- Identifier: `driver1` or `driver@whitelane.local` or `+10000000001`
- Password: `password`
- OTP mode: set `WHITELANE_OTP_FALLBACK_TO_PASSWORD=true` (default) to accept the same password as OTP until SMS is integrated; or set a one-time code with `Cache::put('driver_login_otp:{userId}', '123456', now()->addMinutes(5))`.

## Flutter app URL

Point the app at:

`https://your-domain.com/v1`

Example:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com/v1
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Endpoints and payloads |
| [docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md) | Live server, Nginx, MySQL, security checklist |
| [docs/SYSTEM_ANALYSIS.md](docs/SYSTEM_ANALYSIS.md) | Actors, data flows, RBAC (system analyst view) |

## Deploy (HTTPS URL for the mobile app)

**Vercel-native stack (recommended for Vercel):** [whitelane-next/](whitelane-next/) — **Next.js + Prisma + PostgreSQL**, same `/v1` routes and Sanctum-compatible tokens. Set the Vercel project root to `whitelane-next` and add `DATABASE_URL`.

**Laravel (PHP):** **Render** + `render.yaml`, **Fly.io**, **Railway**, or experimental **Vercel PHP** (`vercel.json` in repo root). **Netlify does not run PHP/Laravel APIs.**

See [docs/DEPLOYMENT_AND_OPERATIONS.md](docs/DEPLOYMENT_AND_OPERATIONS.md) and [whitelane-next/README.md](whitelane-next/README.md). After deploy, set `API_BASE_URL=https://your-host/v1` in the app.

## Production checklist

- `APP_DEBUG=false`, strong `APP_KEY`, MySQL/PostgreSQL, Redis for cache/queue
- TLS termination (Nginx / load balancer)
- Set `WHITELANE_OTP_FALLBACK_TO_PASSWORD=false` and implement real OTP (SMS)
- Tune `config/sanctum.php` and token TTLs in `AuthTokenService`
- Scheduler + queues if you add dispatch/notifications

## License

MIT (same as Laravel skeleton). Proprietary business logic remains yours.
