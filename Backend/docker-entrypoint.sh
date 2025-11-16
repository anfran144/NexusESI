#!/bin/bash
# Este script se ejecutará cada vez que un contenedor inicie.

# Termina el script si cualquier comando falla
set -e

# Variable para saber si es la primera vez que se ejecuta (para migraciones)
# Usaremos un "archivo de bloqueo" para esto
LOCK_FILE="/var/www/html/storage/framework/deployed"

# Comprobamos el COMANDO que Docker va a ejecutar
# (el CMD: "apache2-foreground" o "php artisan queue:work", etc.)
if [ "$1" = "apache2-foreground" ] || ([ "$1" = "php" ] && [ "$2" = "artisan" ] && [ "$3" = "queue:work" ]); then
    
    # --- ES UN SERVICIO WEB O WORKER ---
    # Solo ejecutamos migraciones si el archivo de bloqueo NO existe
    if [ ! -f "$LOCK_FILE" ]; then
        echo "Ejecutando tareas de despliegue (migraciones, caché)..."
        
        # 1. Ejecuta migraciones y caché
        php artisan migrate --force
        php artisan optimize:clear
        php artisan config:cache
        php artisan event:cache
        php artisan route:cache
        php artisan view:cache

        echo "Tareas de despliegue completadas."
        
        # 2. "Bloquea" para no volver a ejecutar esto en reinicios
        touch "$LOCK_FILE"
    else
        echo "Las tareas de despliegue ya se ejecutaron, iniciando servicio..."
    fi

else
    # --- ES UN CRON JOB (ej. 'php artisan schedule:run') ---
    # No queremos correr migraciones antes de CADA cron.
    # Así que solo mostramos un mensaje y continuamos.
    echo "Ejecutando comando (Cron)..."
fi

# "exec $@"
# Este comando mágico le dice al script:
# "Ahora ejecuta el CMD original que te pasaron"
# (ej. "apache2-foreground" o "php artisan queue:work")
exec "$@"