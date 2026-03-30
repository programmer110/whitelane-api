#!/usr/bin/env bash
# Full API smoke tests (requires running server + seeded Supabase). Usage:
#   ./scripts/curl-api-test.sh [BASE_URL]
set -euo pipefail
BASE="${1:-http://localhost:3000}"
BASE="${BASE%/}"

fail() { echo "FAIL: $*" >&2; exit 1; }

code() { sed -n 's/^\[\([0-9]*\)\]$/\1/p' | tail -1; }

echo "=== GET $BASE/up ==="
R=$(curl -sS -w "\n[%{http_code}]" "$BASE/up") || fail "curl /up"
echo "$R" | sed '$d'
[[ "$(echo "$R" | code)" == "200" ]] || fail "/up not 200"

echo "=== POST login ==="
R=$(curl -sS -w "\n[%{http_code}]" -X POST "$BASE/v1/auth/driver/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"driver1","secret":"password","mode":"password"}') || fail "curl login"
BODY=$(echo "$R" | sed '$d')
echo "$BODY"
[[ "$(echo "$R" | code)" == "200" ]] || fail "login not 200"
ACCESS=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.access_token) process.exit(1); console.log(j.access_token)" "$BODY") || fail "no access_token"
REFRESH=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.refresh_token) process.exit(1); console.log(j.refresh_token)" "$BODY") || fail "no refresh_token"

echo "=== GET upcoming (Bearer) ==="
R=$(curl -sS -w "\n[%{http_code}]" "$BASE/v1/driver/trips/upcoming" \
  -H "Authorization: Bearer $ACCESS") || fail "curl upcoming"
echo "$R" | sed '$d' | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); if(!Array.isArray(j)) process.exit(1); console.log('trips:', j.length)"
[[ "$(echo "$R" | code)" == "200" ]] || fail "upcoming not 200"

echo "=== GET history ==="
R=$(curl -sS -w "\n[%{http_code}]" "$BASE/v1/driver/trips/history?page=1&page_size=5" \
  -H "Authorization: Bearer $ACCESS") || fail "curl history"
echo "$R" | sed '$d' | head -c 200
echo "..."
[[ "$(echo "$R" | code)" == "200" ]] || fail "history not 200"

echo "=== PATCH presence ==="
R=$(curl -sS -w "\n[%{http_code}]" -X PATCH "$BASE/v1/driver/presence" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"is_online":true,"lat":24.71,"lng":46.67}') || fail "curl presence"
[[ "$(echo "$R" | code)" == "204" ]] || fail "presence not 204"

echo "=== POST refresh ==="
R=$(curl -sS -w "\n[%{http_code}]" -X POST "$BASE/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "$(node -e "console.log(JSON.stringify({refresh_token:process.argv[1]}))" "$REFRESH")") || fail "curl refresh"
echo "$R" | sed '$d' | head -c 120
echo "..."
[[ "$(echo "$R" | code)" == "200" ]] || fail "refresh not 200"

echo "=== POST logout (old access token may be revoked after refresh — re-login) ==="
LOGIN2=$(curl -sS -X POST "$BASE/v1/auth/driver/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"driver1","secret":"password","mode":"password"}')
ACCESS2=$(node -e "console.log(JSON.parse(process.argv[1]).access_token)" "$LOGIN2")
R=$(curl -sS -w "\n[%{http_code}]" -X POST "$BASE/v1/auth/logout" \
  -H "Authorization: Bearer $ACCESS2") || fail "curl logout"
[[ "$(echo "$R" | code)" == "204" ]] || fail "logout not 204"

echo "=== bad login → 404 ==="
R=$(curl -sS -w "\n[%{http_code}]" -X POST "$BASE/v1/auth/driver/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"___nouser___","secret":"x","mode":"password"}')
echo "$R" | sed '$d'
[[ "$(echo "$R" | code)" == "404" ]] || fail "bad login not 404"

echo ""
echo "All checks passed."
