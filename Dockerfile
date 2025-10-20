# Use official Nginx image as base
FROM nginx:alpine

# Create working directory
WORKDIR /usr/share/nginx/html

# Copy application files
COPY index.html .
COPY styles.css .
COPY script.js .
COPY config.js .
COPY env-loader.js .

# Copy custom Nginx configuration template
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx.conf /etc/nginx/nginx.conf

# Copy script for environment variables substitution
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create configuration template
COPY config.template.js /usr/share/nginx/html/config.template.js

# Expose port 8080
EXPOSE 8080

# Use custom entrypoint for environment variables substitution
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]