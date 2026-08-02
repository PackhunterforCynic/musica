# Multi-Stage Build for Musica (Zero-DB Broadcasting Platform)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations and package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install workspaces dependencies
RUN npm install

# Copy source files across workspaces
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build shared library and application bundles
RUN npm --prefix shared run build
RUN npm --prefix server run build
RUN npm --prefix client run build

# Production Runtime Stage
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled build artifacts from builder stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Ensure persistence data directory exists with appropriate permissions
RUN mkdir -p /app/server/data && chmod -R 777 /app/server/data

EXPOSE 3001

CMD ["npm", "--prefix", "server", "start"]
