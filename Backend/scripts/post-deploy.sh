#!/bin/bash

echo "🚀 Iniciando post-deploy script..."

# Limpiar caché de configuración
echo "🧹 Limpiando cachés..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Ejecutar migraciones
echo "📊 Ejecutando migraciones..."
php artisan migrate --force --no-interaction

# Cachear configuraciones para optimizar rendimiento
echo "⚡ Cacheando configuraciones..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimizar autoload
echo "🔧 Optimizando autoload..."
composer dump-autoload --optimize --no-interaction

echo "✅ Post-deploy completado exitosamente!"

