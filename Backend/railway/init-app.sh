#!/usr/bin/env bash
# Make sure this file has executable permissions, run `chmod +x railway/init-app.sh`

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${APP_ROOT}"

echo "▶️  Running Laravel initialization tasks..."

php artisan package:discover --ansi
php artisan migrate --force --ansi
php artisan optimize:clear --ansi
php artisan config:cache --ansi
php artisan event:cache --ansi
php artisan route:cache --ansi
php artisan view:cache --ansi

echo "✅ Laravel initialization completed."