#!/bin/bash
# Script que se ejecuta UNA VEZ en el despliegue del servicio web.
set -e

echo "Running Deploy Script (Web)..."
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache # El servicio web SÍ necesita esto
echo "Deploy Script (Web) Finished."