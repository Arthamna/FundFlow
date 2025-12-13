#!/bin/bash
set -e

# Port yang digunakan (Railway akan menyet `PORT`), default ke 80 bila tidak ada
PORT="${PORT:-80}"

# Pastikan hanya satu MPM aktif
for m in mpm_event mpm_worker; do
  if [ -e "/etc/apache2/mods-enabled/${m}.load" ] || [ -e "/etc/apache2/mods-enabled/${m}.conf" ]; then
    echo "Disabling ${m}..."
    a2dismod ${m} || true
    rm -f /etc/apache2/mods-enabled/${m}.load /etc/apache2/mods-enabled/${m}.conf || true
  fi
done
a2enmod mpm_prefork rewrite || true

# Supress ServerName warning: set global ServerName (localhost aman)
if ! grep -q "^ServerName" /etc/apache2/apache2.conf; then
  echo "ServerName localhost" >> /etc/apache2/apache2.conf
else
  sed -i "s/^ServerName.*/ServerName localhost/" /etc/apache2/apache2.conf
fi

# Update Listen port di ports.conf
if grep -q "^Listen " /etc/apache2/ports.conf; then
  sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
else
  echo "Listen ${PORT}" >> /etc/apache2/ports.conf
fi

# Update VirtualHost untuk default site (000-default.conf)
if [ -f /etc/apache2/sites-available/000-default.conf ]; then
  sed -i "s/<VirtualHost \*:.*>/<VirtualHost *:${PORT}>/g" /etc/apache2/sites-available/000-default.conf || true
  # ensure sites-enabled symlink will point to updated conf (default image already has it)
fi

echo "Starting apache on port ${PORT}..."
exec apache2-foreground
