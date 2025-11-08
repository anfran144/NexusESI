#!/bin/bash
# Wrapper script to find and execute nginx

# Find nginx in nix store
NGINX=$(find /nix/store -name "nginx" -type f -executable 2>/dev/null | head -n1)

if [ -z "$NGINX" ]; then
    echo "ERROR: nginx not found in /nix/store"
    exit 1
fi

echo "Starting Nginx: $NGINX"
exec $NGINX -c /app/nginx/nginx.conf -g 'daemon off;'

