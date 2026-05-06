# ── Stage 1: Build Angular ────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx ng build --configuration production

# ── Stage 2: Serve with Nginx ─────────────────
FROM nginx:1.25-alpine

COPY --from=builder /app/dist/fuse /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
