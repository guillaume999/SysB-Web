# syntax=docker/dockerfile:1
# Multi-stage Dockerfile pour l'admin web SysB (React + Vite servi par nginx).
# Même schéma que PhysioOffice : build Node en stage 1, nginx statique en stage 2.

# ── Stage 1 : build ──────────────────────────────────────────────
# Image Debian (glibc) : évite les soucis Alpine/musl avec les binaires natifs
# de Rollup / esbuild qui font échouer `vite build` dans le conteneur.
FROM node:22-slim AS builder

WORKDIR /app

# Le lockfile est généré sous Windows et n'embarque pas les binaires natifs Linux
# dont Rollup a besoin ; on laisse npm résoudre la bonne plateforme ici.
COPY package.json ./
RUN npm install
RUN node -e "require('@rollup/rollup-linux-x64-gnu')" 2>/dev/null || npm install @rollup/rollup-linux-x64-gnu --no-save

COPY . .

# URL PocketBase injectée au build (Vite inline les VITE_* dans le bundle)
ARG VITE_PB_URL
ENV VITE_PB_URL=${VITE_PB_URL}
RUN npm run build

# ── Stage 2 : nginx ──────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
