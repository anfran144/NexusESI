#!/bin/bash

echo "👷 Iniciando Queue Worker..."

# Ejecutar queue worker con configuraciones optimizadas para Railway
# --tries=3: Intentar 3 veces antes de marcar como fallido
# --timeout=60: Timeout de 60 segundos por job
# --sleep=3: Esperar 3 segundos entre verificaciones
# --max-jobs=1000: Reiniciar después de 1000 jobs para prevenir memory leaks
# --max-time=3600: Reiniciar después de 1 hora

php artisan queue:work database \
    --tries=3 \
    --timeout=60 \
    --sleep=3 \
    --max-jobs=1000 \
    --max-time=3600 \
    --verbose \
    --no-interaction

