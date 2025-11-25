# Multi-stage build: Backend + Frontend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

# Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copiar package.json del backend y instalar solo dependencias de produccion
COPY backend/package*.json ./
RUN npm ci --only=production

# Copiar backend compilado
COPY --from=backend-builder /app/backend/dist ./dist

# Copiar frontend compilado al directorio que el backend espera
COPY --from=frontend-builder /app/frontend/dist ./frontend-dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
