# Dockerfile (deterministic)
FROM php:8.2-apache

# install OS deps dan PHP extensions
RUN apt-get update && apt-get install -y \
    libzip-dev unzip git default-mysql-client libonig-dev \
  && docker-php-ext-install mysqli pdo pdo_mysql zip mbstring \
  && rm -rf /var/lib/apt/lists/*

# salin composer binary
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# copy composer manifest dulu (cache layer)
COPY composer.json composer.lock* ./

# install composer deps tanpa menjalankan scripts (safe)
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-scripts

# copy aplikasi
COPY . .

# pastikan tidak ada MPM ganda di layer build (hapus symlink bila ada)
RUN set -eux; \
    for m in mpm_event mpm_worker; do \
      if [ -e /etc/apache2/mods-enabled/${m}.load ] || [ -e /etc/apache2/mods-enabled/${m}.conf ]; then \
        a2dismod ${m} || true; \
        rm -f /etc/apache2/mods-enabled/${m}.load /etc/apache2/mods-enabled/${m}.conf || true; \
      fi; \
    done; \
    a2enmod mpm_prefork rewrite || true

# buat entrypoint script (lihat di bawah)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]
