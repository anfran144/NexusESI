# syntax=docker/dockerfile:1.6

###############################################
# Stage 1: Install PHP dependencies with Composer
###############################################
FROM php:8.3-cli AS vendor
WORKDIR /var/www/html

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

# Install system packages needed to compile PHP extensions
RUN apt-get update && apt-get install -y \
        git \
        unzip \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libgmp-dev \
        libzip-dev \
        libicu-dev \
        libonig-dev \
        libxml2-dev \
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

# Install Composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && php -r "unlink('composer-setup.php');"

# Install Composer dependencies (cached layer)
COPY composer.json composer.lock ./
RUN composer install \
        --prefer-dist \
        --no-dev \
        --no-progress \
        --no-interaction \
        --optimize-autoloader \
        --no-scripts

# Copy the rest of the application code
COPY . .

# (He eliminado el segundo 'composer install' de aquí, ya no era necesario)

###############################################
# Stage 2: Build frontend assets
###############################################
FROM node:20 AS frontend
WORKDIR /var/www/html

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install --no-audit --no-fund; \
    fi

COPY --from=vendor /var/www/html/resources ./resources
COPY --from=vendor /var/www/html/vite.config.js ./vite.config.js
COPY --from=vendor /var/www/html/tailwind.config.* ./
COPY --from=vendor /var/www/html/postcss.config.* ./
# (He eliminado la copia duplicada de 'package.json' de aquí)

RUN npm run build || echo "Skipping asset build (no Vite configuration found)."

###############################################
# Stage 3: Production image (Web Server)
###############################################
FROM php:8.3-apache AS production

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    APP_ENV=production \
    APP_DEBUG=0

# Install system dependencies and PHP extensions
# (Nota: Esta es una duplicación de la etapa 'vendor', idealmente se usaría una etapa 'base' común)
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

# Configure Apache
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
        /etc/apache2/conf-available/*.conf \
    && a2enmod rewrite headers

WORKDIR /var/www/html

# Copy application files
COPY --from=vendor /var/www/html /var/www/html

# Copy built assets
COPY --from=frontend /var/www/html/public/build /var/www/html/public/build

# Set permissions
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

CMD ["apache2-foreground"]

###############################################
# Stage 4: Worker image (Queue & Cron)
###############################################
FROM php:8.3-cli AS worker

ENV APP_ENV=production \
    APP_DEBUG=0

# Install system dependencies and PHP extensions (igual que production)
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

WORKDIR /var/www/html

# Copy application files
COPY --from=vendor /var/www/html /var/www/html

# Set permissions
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

# Comando por defecto para el worker de colas
CMD ["php", "artisan", "queue:work", "--sleep=3", "--tries=3"]