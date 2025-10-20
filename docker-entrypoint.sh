#!/bin/sh

# Set default values
API_HOST=${API_HOST:-localhost}
API_PORT=${API_PORT:-5000}
API_ENDPOINT=${API_ENDPOINT:-/api/records}

# Backend variables for nginx proxy
BACKEND_HOST=${BACKEND_HOST:-${API_HOST}}
BACKEND_PORT=${BACKEND_PORT:-${API_PORT}}

echo "Configuring frontend with:"
echo "  API_HOST: $API_HOST"
echo "  API_PORT: $API_PORT" 
echo "  API_ENDPOINT: $API_ENDPOINT"
echo "  BACKEND_HOST: $BACKEND_HOST"
echo "  BACKEND_PORT: $BACKEND_PORT"

# Substitute environment variables in configuration template
envsubst '${API_HOST} ${API_PORT} ${API_ENDPOINT}' < /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/env-config.js

# Substitute backend variables in nginx config template
sed "s/BACKEND_HOST_PLACEHOLDER/${BACKEND_HOST}/g; s/BACKEND_PORT_PLACEHOLDER/${BACKEND_PORT}/g" \
    /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Update index.html to load env-config.js
sed -i 's|<script src="env-loader.js"></script>|<script src="env-config.js"></script>\n    <script src="env-loader.js"></script>|' /usr/share/nginx/html/index.html

echo "Configuration complete!"

# Start Nginx
exec "$@"