#!/usr/bin/env bash
set -euo pipefail

: "${WEB_BASE_URL:=https://new.layered.work}"
: "${DASHBOARD_BASE_URL:=https://dashboard.layered.work}"
: "${API_BASE_URL:=https://api.layered.work}"
: "${SMOKE_RETRIES:=12}"
: "${SMOKE_RETRY_DELAY:=10}"

check_url() {
  local label="$1"
  local url="$2"
  local output
  local status
  local attempt

  for attempt in $(seq 1 "$SMOKE_RETRIES"); do
    set +e
    output="$(curl --fail --silent --show-error "$url" 2>&1 >/dev/null)"
    status="$?"
    set -e

    if [ "$status" -eq 0 ]; then
      echo "OK: $label"
      return 0
    fi

    if [ "$attempt" -lt "$SMOKE_RETRIES" ] && { [ "$status" -eq 6 ] || [ "$status" -eq 7 ] || [ "$status" -eq 28 ]; }; then
      echo "::warning::$label smoke check attempt $attempt/$SMOKE_RETRIES failed while route is settling: $output"
      sleep "$SMOKE_RETRY_DELAY"
      continue
    fi

    break
  done

  echo "$output" >&2
  return "$status"
}

check_url "frontend" "$WEB_BASE_URL"
check_url "dashboard" "$DASHBOARD_BASE_URL"
check_url "api" "$API_BASE_URL/api/health"
