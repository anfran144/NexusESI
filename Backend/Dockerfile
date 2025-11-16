# syntax=docker/dockerfile:1.6

# ---------------------------------------------
# Etapa 1: 'vendor' - Instalar dependencias PHP
# ---------------------------------------------
    FROM php:8.3-cli AS vendor
    WORKDIR /var/www/html
    
    ENV COMPOSER_ALLOW_SUPERUSER=1 \
        COMPOSER_NO_INTERACTION=1
    
    # Instalar dependencias del sistema y extensiones de PHP
    RUN apt-get update && apt-get install -y \
            git \
            unzip \
            libgmp-dev \
            libpng-dev \
            libjpeg-dev \
            libfreetype6-dev \
            libonig-dev \
            libzip-dev \
            libxml2-dev \
            libicu-dev \
            libpq-dev \
        && docker-php-ext-configure gd --with-freetype --with-jpeg \
        && docker-php-ext-install -j$(nproc) \
            bcmath \
            gd \
            gmp \
            intl \
            opcache \
            pcntl \
            pdo_mysql \
            pdo_pgsql \
            zip \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/*
    
    # Instalar Composer
    RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
        && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
        && php -r "unlink('composer-setup.php');"
    
    # Copiar solo composer.json/lock e instalar (para caché de Docker)
    COPY composer.json composer.lock ./
    RUN composer install \
            --prefer-dist \
            --no-dev \
            --no-progress \
            --optimize-autoloader \
            --no-scripts
    
    # Copiar el resto del código (incluyendo tu 'docker-entrypoint.sh')
    COPY . .
    
    
    # ---------------------------------------------
    # Etapa 2: 'frontend' - Compilar assets
    # ---------------------------------------------
    FROM node:20 AS frontend
    WORKDIR /var/www/html
    
    # Copiar archivos de configuración de Node
    COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
    RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
        elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
        elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
        else npm install --no-audit --no-fund; \
        fi
    
    # Copiar archivos fuente para compilación de assets
    COPY --from=vendor /var/www/html/resources ./resources
    COPY --from=vendor /var/www/html/vite.config.js ./vite.config.js
    COPY --from=vendor /var/www/html/tailwind.config.* ./
    COPY --from=vendor /var/www/html/postcss.config.* ./
    
    # Compilar assets
    RUN npm run build || echo "Skipping asset build."
    
    
    # ---------------------------------------------
    # Etapa 3: 'production' - Servidor Web Apache
    # ---------------------------------------------
    FROM php:8.3-apache AS production
    
    ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
        APP_ENV=production \
        APP_DEBUG=0
    
    # Instalar extensiones de PHP (solo las necesarias para apache)
    RUN apt-get update && apt-get install -y \
            libgmp-dev \
            libpng-dev \
            libjpeg-dev \
            libfreetype6-dev \
            libonig-dev \
            libzip-dev \
            libxml2-dev \
            libicu-dev \
            libpq-dev \
        && docker-php-ext-configure gd --with-freetype --with-jpeg \
        && docker-php-ext-install -j$(nproc) \
            bcmath \
            gd \
            gmp \
            intl \
            opcache \
            pcntl \
            pdo_mysql \
            pdo_pgsql \
            zip \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/*
    
    # Configurar Apache
    RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
            /etc/apache2/sites-available/*.conf \
            /etc/apache2/conf-available/*.conf \
        && a2enmod rewrite headers
    
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
    
    # Instalar extensiones de PHP (igual que 'vendor')
    RUN apt-get update && apt-get install -y \
            libgmp-dev \
            libpng-dev \
            libjpeg-dev \
            libfreetype6-dev \
            libonig-dev \
            libzip-dev \
            libxml2-dev \
            libicu-dev \
            libpq-dev \
        && docker-php-ext-configure gd --with-freetype --with-jpeg \
        && docker-php-ext-install -j$(nproc) \
            bcmath \
            gd \
            gmp \
            intl \
            opcache \
            pcntl \
            pdo_mysql \
            pdo_pgsql \
            zip \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/*
    
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