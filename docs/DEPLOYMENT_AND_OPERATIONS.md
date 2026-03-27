# Deployment & operations (live server)

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
