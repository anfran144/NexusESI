#!/bin/bash
# Railway Start Script for NexusESI Backend
# This script initializes the Laravel application and starts all necessary services

set -e

echo "🚀 Starting NexusESI Backend on Railway..."

# Set proper permissions
echo "📝 Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force --no-interaction

# Create storage link if it doesn't exist
echo "🔗 Creating storage link..."
mkdir -p public/storage 2>/dev/null || true
php artisan storage:link --force 2>/dev/null || echo "⚠️  Storage link skipped (not critical for Railway)"

# Clear and cache configurations
echo "⚡ Optimizing application..."
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Generate APP_KEY if not set (safety check)
if [ -z "$APP_KEY" ]; then
    echo "⚠️  APP_KEY not set, generating one..."
    php artisan key:generate --force
fi

# Create Nginx configuration in app directory
echo "🌐 Configuring Nginx..."
mkdir -p /app/nginx
cat > /app/nginx/nginx.conf <<'EOF'
worker_processes auto;
pid /tmp/nginx.pid;
error_log /dev/stderr info;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    access_log /dev/stdout;
    error_log /dev/stderr;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    upstream php-fpm {
        server 127.0.0.1:9000;
    }
    
    server {
        listen ${PORT:-8000};
        server_name _;
        root /app/public;
        
        index index.php;
        
        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }
        
        location ~ \.php$ {
            fastcgi_pass php-fpm;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
            fastcgi_read_timeout 300;
        }
        
        location ~ /\.(?!well-known).* {
            deny all;
        }
    }
}
EOF

# Start Supervisor to manage all processes
echo "🎯 Starting Supervisor..."
exec /usr/bin/supervisord -c /app/supervisord.conf

