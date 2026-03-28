# Deployment & operations (live server)

## Vercel and Netlify

This project is a **Laravel (PHP) API** with a **SQL database**, sessions, and migrations.

| Platform | Fit |
|----------|-----|
| **Netlify** | **Cannot** run this Laravel API. Netlify Functions are Node/Go (not PHP). You could host a **static** `public/` build only; `index.php` would not execute. **Do not** expect `/v1` JSON APIs to work on Netlify. |
| **Vercel** | **Supported** via `serverless` PHP (`vercel-php`, see `api/index.php` + `vercel.json`). You **must** use a **remote** Postgres/MySQL (e.g. [Neon](https://neon.tech) free tier); SQLite is incompatible with the read‑only filesystem. Respect the **~250MB** deployment size limit (this app’s `vendor` is small enough). |

### Vercel (step‑by‑step)

1. **Database:** Create a Postgres instance (Neon recommended). Copy the connection string.
2. **Vercel project:** Import this Git repo. Set **Node.js 18** (see `package.json` `engines` and `.nvmrc`) — required for `vercel-php` builds.
3. **Environment variables** (Project → Settings → Environment Variables), for **Production**:
   - `APP_KEY` — `php artisan key:generate --show` locally
   - `APP_URL` — `https://<your-project>.vercel.app`
   - `APP_ENV=production`, `APP_DEBUG=false`
   - `DB_CONNECTION=pgsql`, `DB_URL` or `DATABASE_URL` — Neon connection string  
   `vercel.json` already sets `/tmp` cache paths and `CACHE_STORE=array` / `SESSION_DRIVER=array` for serverless.
4. **Migrations:** From your machine (not on Vercel’s filesystem):  
   `DB_URL="postgresql://..." php artisan migrate --force`  
   Optional seed: `php artisan db:seed --force` only on non‑production.
5. **Deploy:** Push to the connected branch or run `vercel --prod` after `vercel login`.
6. Verify `GET https://<project>.vercel.app/up` and `POST /v1/auth/driver/login` with `Authorization: Bearer` where required.

For **Git push → HTTPS URL** with minimal ops, use **`render.yaml` + Docker** in this repo (PostgreSQL), or any PHP‑capable host (Nginx + PHP‑FPM, Laravel Forge, Fly.io, Railway, etc.) as described below.

### Recommendation for this project

- **Best fit for Vercel:** the **`whitelane-next/`** app (Next.js + Prisma + Postgres). First-class Node serverless, no PHP runtime. Same **`/v1`** URLs as this Laravel app; tokens are Sanctum-compatible if you share the database.
- **Easiest full stack (app + managed Postgres) without Vercel:** [Render](https://render.com) + `render.yaml` — one blueprint, **`DB_URL`** wired, migrations via container boot. Free web tier **sleeps** when idle (cold starts).
- **Laravel on Vercel (PHP):** **`vercel.json`** + **`api/index.php`** (see above). You must bring **external Postgres** (e.g. Neon) and run **migrations** yourself. Prefer **Node 18** for `vercel-php` builds.
- **Fly.io / Railway:** see sections below.

## Managed PaaS (Render + Docker)

1. Push this repo to GitHub/GitLab.
2. In [Render](https://render.com), **New → Blueprint**, select the repo, apply `render.yaml`.
3. In the web service **Environment**, add secrets (not in git):
   - `APP_KEY` — run locally: `php artisan key:generate --show`
   - `APP_URL` — your service URL, e.g. `https://whitelane-api.onrender.com`
4. After deploy, open `GET /up` and then `POST /v1/auth/driver/login` (see `docs/API_REFERENCE.md`). Point the mobile app at `https://<host>/v1`.

Optional: set `SEED_ON_DEPLOY=true` **once** on a throwaway instance if you want demo data from `DatabaseSeeder`; remove it afterward for production.

## Free / low-cost hosting (Docker-friendly, open tooling)

These are common choices for **open-source stacks** (Laravel + Postgres/MySQL). None of them require a paid license; limits are the provider’s **free tier** or **usage credits**.

| Option | Cost model | Notes |
|--------|------------|--------|
| **[Render](https://render.com)** | Free web service + free Postgres (limits; DB trial may expire) | Easiest path here: `render.yaml` + Git. Service **spins down** when idle (~30–60s cold start). |
| **[Fly.io](https://fly.io)** | Free allowance (shared CPU, bandwidth caps) | This repo includes **`fly.toml`** + `Dockerfile`. Postgres is **separate** (often small paid add-on); use `fly postgres create` + `attach`, or an external free DB. `DATABASE_URL` is read by Laravel (see `config/database.php`). |
| **[Railway](https://railway.app)** | ~$5/month **credit** (often enough for small APIs) | Connect repo, add Postgres, set same env vars as Render. |
| **[Koyeb](https://www.koyeb.com)** | Free tier for small apps | Docker deploy; add managed DB or external Postgres. |
| **Oracle Cloud “Always Free” ARM VM** | Free VM (you manage OS) | Install Docker or Nginx + PHP-FPM yourself; full control, more ops. |

**Self-hosted (open source control plane):** [Coolify](https://coolify.io) and [CapRover](https://caprover.com) are **free software** you run on **your own** VPS; the VPS is usually paid (except Oracle free tier, etc.).

## Fly.io (this repository)

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/), then from the project root: `fly auth login`.
2. If the name `whitelane-api` is taken, run `fly launch` and choose a **unique** app name (update `app` in `fly.toml` to match).
3. Create and attach Postgres: `fly postgres create`, then `fly postgres attach --app <your-app> <postgres-app-name>` (sets `DATABASE_URL`).
4. Set secrets: `APP_KEY` (`php artisan key:generate --show`), `APP_URL` (`https://<app>.fly.dev`), and ensure `DB_CONNECTION=pgsql` (already in `fly.toml` `[env]`).
5. `fly deploy` — then verify `GET https://<app>.fly.dev/up` and `/v1` routes.

## Stack assumptions

- PHP **8.2+** with extensions: `mbstring`, `openssl`, `pdo`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`
- **Composer** 2.x
- **MySQL 8** or **MariaDB 10.6+** (recommended for production; SQLite is dev-only)
- **Nginx** (or Apache) reverse proxy → `php-fpm`
- Optional: **Redis** for cache/queue, **Supervisor** for `php artisan queue:work`

## Deploy steps

1. Clone/upload `whitelane-api` outside the public web root (e.g. `/var/www/whitelane-api`).
2. `composer install --no-dev --optimize-autoloader`
3. Copy `.env.example` → `.env`, set:
   - `APP_ENV=production`, `APP_DEBUG=false`
   - `APP_URL=https://api.yourdomain.com`
   - `DB_*` for MySQL
   - `CACHE_STORE=redis` / `QUEUE_CONNECTION=redis` (if used)
   - `WHITELANE_OTP_FALLBACK_TO_PASSWORD=false` after SMS OTP is live
4. `php artisan key:generate`
5. `php artisan migrate --force`
6. **Do not** run `db:seed` on production unless intentional.
7. `php artisan config:cache` && `php artisan route:cache`
8. Point Nginx `root` to `public/` only.

## Nginx (sketch)

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    root /var/www/whitelane-api/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

## Security

- TLS 1.2+ only; HSTS when stable.
- Firewall: only 80/443 public; DB not exposed.
- Rate-limit `/v1/auth/*` (Nginx `limit_req` or Laravel `throttle` — `api` middleware already applies default throttling where configured).
- Rotate Sanctum tokens on password change (already revoking all tokens in `AuthTokenService::issuePair` on login).
- Backups: DB daily; test restores.

## Health

- Laravel 11+ includes `GET /up` (outside `/v1`) for load balancer health checks.

## Logs

- `storage/logs/laravel.log` — ship to centralized logging in production.

## Admin / provisioning

- Create drivers with `role=driver`, `account_status=active`, `password` hashed (Eloquent handles hashing).
- Optional columns: `username`, `phone` for login identifiers.
- Assign trips by setting `driver_id` and `driver_status=offered` after `payment_paid=true`.
