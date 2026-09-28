# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first (cache-friendly)
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies (workspaces)
RUN npm ci --ignore-scripts

# Copy source
COPY shared ./shared
COPY server ./server
COPY client ./client

# Generate Prisma client
RUN npx prisma generate --schema=./server/prisma/schema.prisma

# Build server TypeScript → dist/
RUN npm run build -w server

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Only copy production deps + compiled output
COPY package.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN npm ci --omit=dev --ignore-scripts --workspace=server --workspace=shared

# Copy compiled server
COPY --from=builder /app/server/dist ./server/dist

# Copy Prisma schema + generated client
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server/dist/index.js"]
