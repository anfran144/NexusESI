#!/bin/bash
# Wrapper script to find and execute php-fpm

# Find php-fpm in nix store
PHP_FPM=$(find /nix/store -name "php-fpm" -type f 2>/dev/null | grep "php-8.3" | head -n1)

if [ -z "$PHP_FPM" ]; then
    echo "ERROR: php-fpm not found in /nix/store"
    exit 1
fi

echo "Starting PHP-FPM: $PHP_FPM"
exec $PHP_FPM -F -y /dev/null

