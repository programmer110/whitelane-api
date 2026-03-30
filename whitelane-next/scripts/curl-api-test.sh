#!/usr/bin/env bash
# Full API smoke tests (requires running server + seeded Supabase).
#
# Usage:
#   ./scripts/curl-api-test.sh [BASE_URL]
#
# If Vercel **Deployment Protection** is on (preview URLs: HTML wall or "Redirecting..."),
# set a bypass token from Vercel → Project → Settings → Deployment Protection:
#   VERCEL_PROTECTION_BYPASS='your_token' ./scripts/curl-api-test.sh https://your-app-git-main-xxx.vercel.app
#
# The script uses **-L** (follow redirects) and, when the bypass is set, a **cookie jar** so
# Vercel can set the bypass cookie on the first hop and reuse it on later requests.
#
# Or disable protection for Preview, or test the **production** domain instead.
set -euo pipefail
BASE="${1:-http://localhost:3000}"
BASE="${BASE%/}"

fail() { echo "FAIL: $*" >&2; exit 1; }

code() { sed -n 's/^\[\([0-9]*\)\]$/\1/p' | tail -1; }

# Follow redirects; reuse cookies when bypass is used (Vercel sets a cookie then redirects).
CURL_BASE=( -sS -L )
COOKIE_JAR=""
if [[ -n "${VERCEL_PROTECTION_BYPASS:-}" ]]; then
  COOKIE_JAR=$(mktemp "${TMPDIR:-/tmp}/whitelane-curl-cookies.XXXXXX")
  CURL_BASE+=( -c "$COOKIE_JAR" -b "$COOKIE_JAR" )
  trap '[[ -n "${COOKIE_JAR:-}" ]] && rm -f "$COOKIE_JAR"' EXIT
fi

# Append Vercel protection bypass query params when VERCEL_PROTECTION_BYPASS is set.
with_bypass() {
  local url="$1"
  if [[ -z "${VERCEL_PROTECTION_BYPASS:-}" ]]; then
    echo "$url"
    return
  fi
  local sep='?'
  [[ "$url" == *\?* ]] && sep='&'
  echo "${url}${sep}x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${VERCEL_PROTECTION_BYPASS}"
}

vercel_auth_wall() {
  grep -q 'Authentication Required' <<<"${1:-}" && grep -q 'vercel.com' <<<"${1:-}"
}

# Minimal body from Vercel edge before SSO / cookie flow (not your API JSON).
vercel_redirect_stub() {
  local b="${1:-}"
  grep -qi 'Redirecting' <<<"$b" && ! grep -q '"ok"' <<<"$b" && ! grep -q '"access_token"' <<<"$b"
}

body_of() { echo "$1" | sed '$d'; }

is_up_json() {
  node -e "const j=JSON.parse(process.argv[1]); process.exit(j && typeof j==='object' ? 0 : 1)" "$1" 2>/dev/null
}

# If body is JSON object, assume API (caller checks status). Otherwise detect Vercel protection HTML/stub.
check_json_or_vercel_barrier() {
  local b="$1"
  if is_up_json "$b"; then
    return 0
  fi
  if vercel_auth_wall "$b" || vercel_redirect_stub "$b"; then
    echo "" >&2
    echo "This host is still behind Vercel Deployment Protection (not your /up JSON)." >&2
    echo "You may see HTML \"Authentication Required\" or a short \"Redirecting...\" body." >&2
    echo "Fix one of:" >&2
    echo "  • Vercel → Project → Settings → Deployment Protection → allow Preview without auth, or" >&2
    echo "  • Use your production URL (e.g. <project>.vercel.app), or" >&2
    echo "  • VERCEL_PROTECTION_BYPASS='<token>' ./scripts/curl-api-test.sh $BASE" >&2
    echo "    (token + cookie jar + -L are applied automatically when that env is set.)" >&2
    echo "    https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation" >&2
    exit 2
  fi
}

echo "=== GET $BASE/up ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" "$(with_bypass "$BASE/up")") || fail "curl /up"
echo "$R" | sed '$d' | head -c 400
echo
check_json_or_vercel_barrier "$(body_of "$R")"
[[ "$(echo "$R" | code)" == "200" ]] || fail "/up not 200"

echo "=== POST login ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" -X POST "$(with_bypass "$BASE/v1/auth/driver/login")" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"driver1","secret":"password","mode":"password"}') || fail "curl login"
BODY=$(echo "$R" | sed '$d')
echo "$BODY" | head -c 500
echo
check_json_or_vercel_barrier "$BODY"
[[ "$(echo "$R" | code)" == "200" ]] || fail "login not 200"
ACCESS=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.access_token) process.exit(1); console.log(j.access_token)" "$BODY") || fail "no access_token"
REFRESH=$(node -e "const j=JSON.parse(process.argv[1]); if(!j.refresh_token) process.exit(1); console.log(j.refresh_token)" "$BODY") || fail "no refresh_token"

echo "=== GET upcoming (Bearer) ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" "$(with_bypass "$BASE/v1/driver/trips/upcoming")" \
  -H "Authorization: Bearer $ACCESS") || fail "curl upcoming"
echo "$R" | sed '$d' | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); if(!Array.isArray(j)) process.exit(1); console.log('trips:', j.length)"
[[ "$(echo "$R" | code)" == "200" ]] || fail "upcoming not 200"

echo "=== GET history ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" "$(with_bypass "$BASE/v1/driver/trips/history?page=1&page_size=5")" \
  -H "Authorization: Bearer $ACCESS") || fail "curl history"
echo "$R" | sed '$d' | head -c 200
echo "..."
[[ "$(echo "$R" | code)" == "200" ]] || fail "history not 200"

echo "=== PATCH presence ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" -X PATCH "$(with_bypass "$BASE/v1/driver/presence")" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"is_online":true,"lat":24.71,"lng":46.67}') || fail "curl presence"
[[ "$(echo "$R" | code)" == "204" ]] || fail "presence not 204"

echo "=== POST refresh ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" -X POST "$(with_bypass "$BASE/v1/auth/refresh")" \
  -H "Content-Type: application/json" \
  -d "$(node -e "console.log(JSON.stringify({refresh_token:process.argv[1]}))" "$REFRESH")") || fail "curl refresh"
echo "$R" | sed '$d' | head -c 120
echo "..."
[[ "$(echo "$R" | code)" == "200" ]] || fail "refresh not 200"

echo "=== POST logout (re-login) ==="
LOGIN2=$(curl "${CURL_BASE[@]}" -X POST "$(with_bypass "$BASE/v1/auth/driver/login")" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"driver1","secret":"password","mode":"password"}')
ACCESS2=$(node -e "console.log(JSON.parse(process.argv[1]).access_token)" "$LOGIN2")
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" -X POST "$(with_bypass "$BASE/v1/auth/logout")" \
  -H "Authorization: Bearer $ACCESS2") || fail "curl logout"
[[ "$(echo "$R" | code)" == "204" ]] || fail "logout not 204"

echo "=== bad login → 404 ==="
R=$(curl "${CURL_BASE[@]}" -w "\n[%{http_code}]" -X POST "$(with_bypass "$BASE/v1/auth/driver/login")" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"___nouser___","secret":"x","mode":"password"}')
echo "$R" | sed '$d'
[[ "$(echo "$R" | code)" == "404" ]] || fail "bad login not 404"

echo ""
echo "All checks passed."
