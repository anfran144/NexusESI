#!/bin/bash
# Railway worker script for NexusESI Worker Service
# Make sure this file has executable permissions, run `chmod +x railway/run-worker.sh`

echo "🔄 Starting Laravel Queue Worker..."

# This command runs the queue worker.
# An alternative is to use the php artisan queue:listen command
php artisan queue:work database --sleep=3 --tries=3 --max-time=3600 --timeout=300

