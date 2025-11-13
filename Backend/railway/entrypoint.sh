#!/usr/bin/env bash

set -euo pipefail

ROLE="${1:-${CONTAINER_ROLE:-app}}"
shift || true

PROJECT_ROOT="/var/www/html"
PORT_VALUE="${PORT:-8080}"

log() {
    local timestamp
    timestamp="$(date +"%Y-%m-%d %H:%M:%S%z")"
    echo "[$timestamp] [${ROLE}] $*"
}

artisan() {
    gosu www-data php artisan "$@" --ansi
}

ensure_permissions() {
    chown -R www-data:www-data "${PROJECT_ROOT}/storage" "${PROJECT_ROOT}/bootstrap/cache"
}

warm_common_caches() {
    artisan optimize:clear
    artisan package:discover
    artisan config:cache
    artisan event:cache
    artisan route:cache
    artisan view:cache
}

configure_apache_port() {
    sed -ri "s/Listen [0-9]+/Listen ${PORT_VALUE}/" /etc/apache2/ports.conf
    sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost \*:${PORT_VALUE}>/" /etc/apache2/sites-available/000-default.conf
}

case "${ROLE}" in
    app)
        log "Bootstrapping Laravel application..."
        ensure_permissions
        if [[ -x "${PROJECT_ROOT}/railway/init-app.sh" ]]; then
            gosu www-data bash "${PROJECT_ROOT}/railway/init-app.sh"
        else
            warm_common_caches
        fi
        configure_apache_port
        log "Starting Apache on port ${PORT_VALUE}..."
        exec apache2-foreground
        ;;
    worker)
        log "Starting queue worker..."
        ensure_permissions
        warm_common_caches
        exec gosu www-data bash "${PROJECT_ROOT}/railway/run-worker.sh" "$@"
        ;;
    cron)
        log "Starting scheduler..."
        ensure_permissions
        warm_common_caches
        exec gosu www-data bash "${PROJECT_ROOT}/railway/run-cron.sh" "$@"
        ;;
    *)
        log "Executing custom command: ${ROLE} $*"
        exec "${ROLE}" "$@"
        ;;
esac


