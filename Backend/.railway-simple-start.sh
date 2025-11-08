#!/bin/bash
# Simple Railway start script for Laravel
# Railway will handle nginx and php-fpm automatically

set -e

echo "🚀 Starting NexusESI Backend on Railway..."

# Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force --no-interaction

# Clear and cache
echo "⚡ Optimizing application..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start queue worker in background
echo "🔄 Starting queue worker..."
php artisan queue:work database --sleep=3 --tries=3 --daemon &

# Start scheduler in background  
echo "⏰ Starting scheduler..."
(while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done) &

echo "✅ Backend initialized successfully!"
echo "Railway will handle nginx and php-fpm automatically"

# Keep container running
wait

