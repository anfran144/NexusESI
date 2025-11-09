#!/bin/bash
# Railway worker script for NexusESI Worker Service
# Make sure this file has executable permissions, run `chmod +x railway/run-worker.sh`

echo "🔄 Starting Laravel Queue Worker..."

# This command runs the queue worker.
php artisan queue:work

