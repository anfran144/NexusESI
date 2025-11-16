# syntax=docker/dockerfile:1.6

# ---------------------------------------------
# Etapa 1: 'vendor' - (Sin cambios)
# ---------------------------------------------
    FROM php:8.3-cli AS vendor
    WORKDIR /var/www/html
    # ... (todo lo de composer install, etc. va aquí)...
    # ... (asegúrate de que COPIAS el nuevo script aquí también)...
    COPY . .
    
    
    # ---------------------------------------------
    # Etapa 2: 'frontend' - (Sin cambios)
    # ---------------------------------------------
    FROM node:20 AS frontend
    # ... (todo lo de npm build va aquí)...
    
    
    # ---------------------------------------------
    # Etapa 3: 'production' - Servidor Web Apache
    # ---------------------------------------------
    FROM php:8.3-apache AS production
    
    ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
        APP_ENV=production \
        APP_DEBUG=0
    
    # ... (toda la instalación de extensiones de PHP va aquí)...
    # ... (toda la configuración de Apache va aquí)...
    
    WORKDIR /var/www/html
    
    # Copiar archivos de la aplicación desde 'vendor'
    COPY --from=vendor /var/www/html /var/www/html
    
    # Copiar assets compilados desde 'frontend'
    COPY --from=frontend /var/www/html/public/build /var/www/html/public/build
    
    # Configurar permisos
    RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs \
        && chown -R www-data:www-data storage bootstrap/cache
    
    # ----- ¡AQUÍ ESTÁ LA MAGIA! -----
    # 1. Copia el script de entrypoint desde la etapa 'vendor'
    COPY --from=vendor /var/www/html/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
    
    # 2. Dale permisos de ejecución
    RUN chmod +x /usr/local/bin/docker-entrypoint.sh
    
    # 3. Dile a Docker que use este script como punto de entrada
    ENTRYPOINT ["docker-entrypoint.sh"]
    # ------------------------------------
    
    USER www-data
    
    # 4. El CMD ahora se pasa como argumento al ENTRYPOINT
    CMD ["apache2-foreground"]
    
    
    # ---------------------------------------------
    # Etapa 4: 'worker' - Imagen de CLI para Colas/Cron
    # ---------------------------------------------
    FROM php:8.3-cli AS worker
    
    ENV APP_ENV=production \
        APP_DEBUG=0
    
    # ... (toda la instalación de extensiones de PHP va aquí)...
    
    WORKDIR /var/www/html
    
    # Copiar archivos de la aplicación desde 'vendor'
    COPY --from=vendor /var/www/html /var/www/html
    
    # Configurar permisos
    RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs \
        && chown -R www-data:www-data storage bootstrap/cache
    
    # ----- ¡AQUÍ ESTÁ LA MAGIA (DE NUEVO)! -----
    # 1. Copia el script de entrypoint
    COPY --from=vendor /var/www/html/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
    
    # 2. Dale permisos de ejecución
    RUN chmod +x /usr/local/bin/docker-entrypoint.sh
    
    # 3. Configura el ENTRYPOINT
    ENTRYPOINT ["docker-entrypoint.sh"]
    # ------------------------------------
    
    USER www-data
    
    # 4. El CMD por defecto para el worker
    CMD ["php", "artisan", "queue:work", "--sleep=3", "--tries=3"]