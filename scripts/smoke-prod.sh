#!/usr/bin/env bash
set -euo pipefail

: "${WEB_BASE_URL:=https://layered.work}"
: "${DASHBOARD_BASE_URL:=https://dashboard.layered.work}"
: "${API_BASE_URL:=https://api.layered.work}"

curl --fail --silent --show-error "$WEB_BASE_URL" >/dev/null
curl --fail --silent --show-error "$DASHBOARD_BASE_URL" >/dev/null
curl --fail --silent --show-error "$API_BASE_URL/api/health" >/dev/null
