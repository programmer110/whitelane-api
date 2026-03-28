#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
  echo "FATAL: Set APP_KEY in the host environment (e.g. php artisan key:generate --show)."
  exit 1
fi

php artisan migrate --force

if [ "$SEED_ON_DEPLOY" = "true" ]; then
  php artisan db:seed --force
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
