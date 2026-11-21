# Production image: the backend serves the built React app, so the whole site is one service.
# (docker-compose.yml is still used for local development with live reloading.)

# ---- 1. build the frontend ----
FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. backend + the built frontend ----
FROM node:22-alpine
ENV NODE_ENV=production \
    STATIC_DIR=/app/public \
    PORT=3000
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend /build/dist ./public

# run as the non-root "node" user that the image provides
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "server.js"]
