# Whitelane Driver API — Next.js (Vercel-native)

Same JSON API as the Laravel app in the parent directory (`/v1/*`, `GET /up`), implemented with **Next.js App Router** + **Prisma** + **PostgreSQL** so it deploys cleanly on **Vercel** (Node serverless, no PHP runtime).

## Requirements

- Node.js 20+
- PostgreSQL (e.g. [Neon](https://neon.tech) — connect via Vercel Marketplace)

## Setup

```bash
cd whitelane-next
cp .env.example .env
# Set DATABASE_URL to your Postgres URL (same schema as Laravel migrations, or prisma db push)
npm install
npx prisma db push
# Optional: seed data using Laravel’s DatabaseSeeder against the same DB, or insert rows manually
npm run dev
```

- **Local:** [http://localhost:3000/v1/auth/driver/login](http://localhost:3000/v1/auth/driver/login) (POST), [http://localhost:3000/up](http://localhost:3000/up) (GET)
- **Flutter:** `API_BASE_URL=https://<vercel-host>/v1` (same as Laravel)

## Deploy on Vercel

1. Create a Vercel project with root directory **`whitelane-next`** (or import this monorepo and set the root).
2. Add **`DATABASE_URL`** (Neon recommended). Run migrations once: `npx prisma db push` locally against production URL, or use Prisma Migrate in CI.
3. Set **`WHITELANE_OTP_FALLBACK_TO_PASSWORD`** as needed.
4. Deploy. No PHP or `vercel-php` required.

## Behaviour notes

- **Sanctum-compatible** access tokens (`id|secret`, SHA-256 storage) and refresh tokens (SHA-256 of plain refresh) so the same DB can be shared with Laravel **or** this service exclusively.
- **OTP mode** without Redis: only the password fallback (`WHITELANE_OTP_FALLBACK_TO_PASSWORD=true`) matches Laravel’s dev behaviour; for real OTP, add Redis/KV and port the cache lookup.
- **History list:** matches Laravel’s effective filter (completed trips only; `cancelled` in the Laravel `whereIn` is excluded by `confirmedForDriver`).

## License

MIT (align with parent project).
