# gunakan PHP + Apache image resmi
FROM php:8.2-apache

# install dependency OS yang dibutuhkan dan extension PHP
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    git \
    default-mysql-client \
    libonig-dev \
  && docker-php-ext-install mysqli pdo pdo_mysql zip mbstring \
  && a2enmod rewrite \
  && rm -rf /var/lib/apt/lists/*

# salin binary composer (lebih cepat daripada install manual)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# set working dir
WORKDIR /var/www/html

# copy hanya composer files dulu agar layer cache efektif
COPY composer.json composer.lock* ./

# install composer deps (production)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# copy sisa kode aplikasi
COPY . .

# atur kepemilikan dan permission sederhana
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html

EXPOSE 80

# default command untuk image php:apache
CMD ["apache2-foreground"]
