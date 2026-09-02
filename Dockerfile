# Nginx app image
FROM nginx:1-alpine AS nginx

# Add the app to the container
COPY ./dist /usr/share/nginx/html
