#!/bin/bash
# Wrapper script to find and execute php

# Find php in nix store  
PHP=$(find /nix/store -name "php" -type f -executable 2>/dev/null | grep "php-8.3" | head -n1)

if [ -z "$PHP" ]; then
    echo "ERROR: php not found in /nix/store"
    exit 1
fi

exec $PHP "$@"

