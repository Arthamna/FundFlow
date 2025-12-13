#!/bin/bash
set -e

# Pastikan hanya satu MPM aktif saat runtime
for m in mpm_event mpm_worker; do
  if [ -e "/etc/apache2/mods-enabled/${m}.load" ] || [ -e "/etc/apache2/mods-enabled/${m}.conf" ]; then
    echo "Disabling ${m}..."
    a2dismod ${m} || true
    rm -f /etc/apache2/mods-enabled/${m}.load /etc/apache2/mods-enabled/${m}.conf || true
  fi
done

a2enmod mpm_prefork rewrite || true

# jalankan default apache entrypoint
exec apache2-foreground
