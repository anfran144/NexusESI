#!/bin/bash

# Script de inicio para el contenedor Laravel

echo "🚀 Iniciando aplicación Laravel..."

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
while ! php artisan migrate:status &> /dev/null; do
    echo "Esperando conexión a la base de datos..."
    sleep 5
done

echo "✅ Base de datos conectada"

# Ejecutar migraciones si es necesario
echo "🔄 Verificando migraciones..."
php artisan migrate --force

# Generar clave de aplicación si no existe
if [ -z "$APP_KEY" ]; then
    echo "🔑 Generando clave de aplicación..."
    php artisan key:generate
fi

# Generar clave JWT si no existe
if [ -z "$JWT_SECRET" ]; then
    echo "🔐 Generando clave JWT..."
    php artisan jwt:secret
fi

# Limpiar cache
echo "🧹 Limpiando cache..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimizar para producción
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Optimizando para producción..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Iniciar Apache
echo "🌐 Iniciando servidor web..."
exec apache2-foreground
