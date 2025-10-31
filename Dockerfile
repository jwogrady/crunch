# Dockerfile for Bun deployment
# Use with: Docker, Fly.io, Railway, Render, etc.

FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build stage (if needed)
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Production stage
FROM base AS production
ENV NODE_ENV=production

COPY --from=install /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["bun", "run", "src/server.ts"]

