# Dockerfile
FROM php:8.2-apache

# install dependency OS yang dibutuhkan dan extension PHP
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    git \
    default-mysql-client \
    libonig-dev \
  && docker-php-ext-install mysqli pdo pdo_mysql zip mbstring \
  && a2dismod mpm_event mpm_worker || true \
  && a2enmod mpm_prefork rewrite \
  && rm -rf /var/lib/apt/lists/*

# salin binary composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# copy composer files dulu untuk caching
COPY composer.json composer.lock* ./

# install composer deps tanpa menjalankan scripts (opsional)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts

# copy sisa kode aplikasi
COPY . .

# kalau composer scripts perlu dijalankan sebaiknya jalankan di final step manual
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
