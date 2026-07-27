#!/bin/sh
set -e

echo "Substituting environment variables in nginx config..."
envsubst '$CART_SERVICE_URL,$ORDERS_SERVICE_URL,$PRODUCTS_SERVICE_URL,$USER_SERVICE_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
echo "Starting Nginx..."
exec nginx -g 'daemon off;'
