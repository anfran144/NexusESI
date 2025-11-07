#!/bin/bash

echo "⏰ Iniciando Laravel Scheduler..."

# El scheduler debe ejecutarse cada minuto
# Laravel internamente manejará qué comandos ejecutar según el schedule definido
while true; do
    php artisan schedule:run --verbose --no-interaction &
    sleep 60
done

