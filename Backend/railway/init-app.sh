#!/bin/bash
# Railway init script for NexusESI App Service
# Make sure this file has executable permissions, run `chmod +x railway/init-app.sh`

# Exit the script if any command fails
set -e

echo "🚀 Initializing NexusESI App Service..."

# Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Clear cache
echo "🧹 Clearing cache..."
php artisan optimize:clear

# Cache the various components of the Laravel application
echo "⚡ Caching application components..."
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

echo "✅ App initialization complete!"

