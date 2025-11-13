# syntax=docker/dockerfile:1.6

###############################################
# Stage 1: Install PHP dependencies with Composer
###############################################
FROM composer:2 AS vendor
WORKDIR /var/www/html

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

COPY composer.json composer.lock ./
RUN --mount=type=cache,id=composer-cache,target=/tmp/cache/composer \
    composer install \
        --no-dev \
        --no-scripts \
        --prefer-dist \
        --optimize-autoloader

COPY . .
RUN --mount=type=cache,id=composer-cache,target=/tmp/cache/composer \
    composer install \
        --no-dev \
        --no-scripts \
        --prefer-dist \
        --optimize-autoloader

###############################################
# Stage 2: Compile frontend assets with Node
###############################################
FROM node:20 AS frontend
WORKDIR /var/www/html

COPY --from=vendor /var/www/html/package.json ./package.json
RUN npm install --no-audit --no-fund

COPY --from=vendor /var/www/html/resources ./resources
COPY --from=vendor /var/www/html/public ./public
COPY --from=vendor /var/www/html/vite.config.js ./vite.config.js

RUN npm run build

###############################################
# Stage 3: Production image with Apache & PHP
###############################################
FROM php:8.3-apache AS production

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    APP_ENV=production \
    APP_DEBUG=0 \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=0 \
    PHP_OPCACHE_MAX_ACCELERATED_FILES=20000 \
    PHP_OPCACHE_MEMORY_CONSUMPTION=192 \
    PHP_MEMORY_LIMIT=512M \
    CONTAINER_ROLE=app

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
        git \
        unzip \
        libpq-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libicu-dev \
        libonig-dev \
        libxml2-dev \
        libssl-dev \
        gosu \
        cron \
        supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        opcache \
        pcntl \
        pdo_mysql \
        pdo_pgsql \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite headers

# Configure Apache document root
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf \
        /etc/apache2/conf-available/*.conf

# Copy application code and built assets
COPY --from=vendor /var/www/html /var/www/html
COPY --from=frontend /var/www/html/public/build /var/www/html/public/build

# Ensure runtime directories exist and have correct permissions
RUN mkdir -p \
        /var/www/html/storage/framework/cache \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

WORKDIR /var/www/html

# Copy entrypoint script
COPY railway/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint \
    && chmod +x /var/www/html/railway/*.sh

USER root

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint"]
CMD ["app"]


