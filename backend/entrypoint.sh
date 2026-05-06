#!/bin/sh

# Run migrations automatically
php artisan migrate:fresh --seed

# Start the actual server process
exec "$@"
