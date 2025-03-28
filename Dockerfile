# Use an official Node runtime as the build environment
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install project dependencies
RUN npm ci

# Copy the rest of the project files
COPY . .

# Build the project
RUN npm run build

# Use Nginx as the production server
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy the built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a custom nginx configuration
RUN echo 'server { \
    listen 8080; \
    server_name 0.0.0.0; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose the default port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]