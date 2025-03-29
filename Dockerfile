# Use multi-stage build for smaller final image
FROM node:22-alpine3.20 AS builder

# Set working directory
WORKDIR /build

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    linux-headers

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build if necessary (uncomment if you have a build step)
# RUN npm run build

# Final stage
FROM node:22-alpine3.20

# Install runtime dependencies only
RUN apk add --no-cache \
    python3 \
    ffmpeg

# Create non-root user
RUN addgroup -S botuser && adduser -S botuser -G botuser

# Set working directory
WORKDIR /app

# Copy built files from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/src ./src
COPY --from=builder /build/package*.json ./

# Create and set permissions for audio cache directory
RUN mkdir -p audio-cache && chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set Node to use ESM strictly
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"

# Start the bot using proper ESM entry point
CMD ["node", "src/index.js"] 