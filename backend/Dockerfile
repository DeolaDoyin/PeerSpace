FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Set permissions before running composer 
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Setup Nginx config (Render specific)
COPY .render/nginx.conf /etc/nginx/sites-available/default

# --- ADDED: Entrypoint logic to run migrations ---
# This tells Docker to run these specific commands before the server starts
RUN echo "#!/bin/sh\nphp artisan migrate --force\nexec \"\$@\"" > /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port
EXPOSE 80

# Use the entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Start Nginx and PHP-FPM
CMD ["sh", "-c", "service nginx start && php-fpm"]
