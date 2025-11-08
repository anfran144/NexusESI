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

# Find mime.types in Nix store
NGINX_PATH=$(find /nix/store -name "nginx-*" -type d | head -n1)
MIME_TYPES="${NGINX_PATH}/conf/mime.types"

cat > /app/nginx/nginx.conf <<EOF
worker_processes auto;
pid /tmp/nginx.pid;
error_log /dev/stderr info;

events {
    worker_connections 1024;
}

http {
    include ${MIME_TYPES};
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

# Create PHP-FPM configuration
echo "⚙️  Configuring PHP-FPM..."
mkdir -p /app/php-fpm
cat > /app/php-fpm/www.conf <<'PHPFPM'
[www]
user = nobody
group = nobody
listen = 127.0.0.1:9000
listen.owner = nobody
listen.group = nobody
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
catch_workers_output = yes
php_admin_value[error_log] = /dev/stderr
php_admin_flag[log_errors] = on
PHPFPM

# Make wrapper scripts executable
chmod +x /app/.railway-php-fpm.sh
chmod +x /app/.railway-nginx.sh
chmod +x /app/.railway-php.sh

# Start Supervisor to manage all processes
echo "🎯 Starting Supervisor..."
exec supervisord -c /app/supervisord.conf

