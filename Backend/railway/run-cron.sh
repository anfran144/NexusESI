#!/usr/bin/env bash
# Make sure this file has executable permissions, run `chmod +x railway/run-cron.sh`

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${APP_ROOT}"

echo "⏱️  Starting Laravel scheduler loop..."

SLEEP_SECONDS="${SCHEDULER_INTERVAL_SECONDS:-60}"

while true; do
    echo "▶️  Running the scheduler..."
    php artisan schedule:run --verbose --no-interaction --ansi || true
    sleep "${SLEEP_SECONDS}"
done