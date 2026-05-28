#!/usr/bin/env bash
set -euo pipefail

: "${WEB_BASE_URL:=https://layered.work}"
: "${DASHBOARD_BASE_URL:=https://dashboard.layered.work}"
: "${API_BASE_URL:=https://api.layered.work}"

check_url() {
  local label="$1"
  local url="$2"
  local output
  local status

  set +e
  output="$(curl --fail --silent --show-error "$url" 2>&1 >/dev/null)"
  status="$?"
  set -e

  if [ "$status" -eq 0 ]; then
    echo "OK: $label"
    return 0
  fi

  if [ "$status" -eq 6 ]; then
    echo "::warning::Skipping $label smoke check; host is not resolvable yet: $url"
    return 0
  fi

  echo "$output" >&2
  return "$status"
}

check_url "frontend" "$WEB_BASE_URL"
check_url "dashboard" "$DASHBOARD_BASE_URL"
check_url "api" "$API_BASE_URL/api/health"
