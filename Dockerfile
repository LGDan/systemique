# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy source code and build configuration
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js package.json ./

# Build the application
RUN npm run build

# Production stage
FROM caddy:2-alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/caddy

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# # Create a non-root user for Caddy (Caddy runs as non-root by default)
# # Set ownership of web root
# RUN chown -R caddy:caddy /usr/share/caddy

# Expose port 8080 (high port, no root required)
EXPOSE 8080

# Use a non-root user for Caddy (Caddy runs as non-root by default)
USER 1000

# Caddy runs as non-root by default, no USER directive needed
# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

