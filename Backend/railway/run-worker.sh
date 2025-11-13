#!/usr/bin/env bash
# Railway worker script for NexusESI Worker Service
# Make sure this file has executable permissions, run `chmod +x railway/run-worker.sh`

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${APP_ROOT}"

echo "🔄 Starting Laravel Queue Worker..."

WORKER_CONNECTION="${QUEUE_CONNECTION:-database}"
WORKER_ARGS=(
    queue:work
    "${WORKER_CONNECTION}"
    --tries="${QUEUE_TRIES:-3}"
    --timeout="${QUEUE_TIMEOUT:-90}"
    --sleep="${QUEUE_SLEEP:-3}"
)

if [[ -n "${QUEUE_MAX_JOBS:-}" && "${QUEUE_MAX_JOBS}" != "0" ]]; then
    WORKER_ARGS+=("--max-jobs=${QUEUE_MAX_JOBS}")
fi

if [[ -n "${QUEUE_MAX_TIME:-}" && "${QUEUE_MAX_TIME}" != "0" ]]; then
    WORKER_ARGS+=("--max-time=${QUEUE_MAX_TIME}")
fi

exec php artisan "${WORKER_ARGS[@]}"