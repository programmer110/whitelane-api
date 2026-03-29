# Whitelane Driver API — Next.js (Vercel-native)

Same JSON API as the Laravel app (`/v1/*`, `GET /up`), implemented with **Next.js App Router** + **Prisma** + **SQLite** by default (local dev, shared file with Laravel).

## Requirements

- Node.js 20+
- **SQLite** — default `DATABASE_URL` points at the repo’s `database/database.sqlite` (same file Laravel uses).

## Setup (SQLite, shared with Laravel)

From the **repository root**:

```bash
touch database/database.sqlite
cp .env.example .env   # ensure DB_CONNECTION=sqlite
php artisan migrate:fresh --seed   # or migrate
```

Then:

```bash
cd whitelane-next
cp .env.example .env
# DATABASE_URL should be file:../../database/database.sqlite
npm install
npx prisma generate
npm run dev
```

**Do not** run `npx prisma db push` on a database that Laravel already manages — Prisma may try to drop Laravel’s `migrations` table. After Laravel has created the schema, **`prisma generate`** is enough for the Next app to use the same SQLite file.

If you need a **standalone** DB only for Next.js, use a separate file (e.g. `file:./prisma/local.sqlite` in `.env`) and run `npx prisma db push` once on that empty file.

## Production (PostgreSQL / Neon)

Vercel and most hosts do **not** persist SQLite. Use a hosted Postgres (e.g. Neon), set `DATABASE_URL` to the Postgres URL, and change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Restore stricter column types if you want (e.g. `@db.VarChar(64)` on `token`). Then run `npx prisma migrate deploy` or `db push` against production.

## URLs

- Local: `http://localhost:3000/v1/...`, `http://localhost:3000/up`
- Flutter: `API_BASE_URL=https://<host>/v1`

## Behaviour notes

- **Sanctum-compatible** tokens and refresh rows when sharing the Laravel SQLite DB.
- **OTP** without Redis: same as Laravel — use `WHITELANE_OTP_FALLBACK_TO_PASSWORD` for dev-style password-as-OTP.

## License

MIT (align with parent project).
