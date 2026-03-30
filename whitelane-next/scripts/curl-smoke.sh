#!/usr/bin/env bash
# Smoke-test /up and driver login. Usage: ./scripts/curl-smoke.sh [BASE_URL]
set -euo pipefail
BASE="${1:-http://localhost:3000}"
BASE="${BASE%/}"

echo "=== GET $BASE/up ==="
curl -sS -w "\n(http %{http_code})\n" "$BASE/up"
echo

echo "=== POST $BASE/v1/auth/driver/login ==="
curl -sS -w "\n(http %{http_code})\n" \
  -X POST "$BASE/v1/auth/driver/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"driver1","secret":"password","mode":"password"}'
echo
