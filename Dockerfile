# syntax=docker/dockerfile:1
# Multi-stage Dockerfile pour l'admin web SysB (React + Vite servi par nginx).
# Même schéma que PhysioOffice : build Node en stage 1, nginx statique en stage 2.

# ── Stage 1 : build ──────────────────────────────────────────────
# Image Debian (glibc) : évite les soucis Alpine/musl avec les binaires natifs
# du bundler (Rolldown depuis Vite 8, Rollup avant) qui font échouer
# `vite build` dans le conteneur.
FROM node:22-slim AS builder

WORKDIR /app

# ⚠️ `npm ci`, PAS `npm install` (2026-09-09). `npm install` réinterprète les
# plages `^` à chaque build : deux images construites du même commit pouvaient
# embarquer des dépendances différentes, et un bug apparu en prod n'était donc
# pas forcément reproductible en local. `npm ci` installe EXACTEMENT le
# lockfile, et échoue si le lockfile ne colle plus au package.json — ce qui est
# précisément ce qu'on veut apprendre au build, pas en prod.
#
# ⚠️ Le lockfile est régénéré sous Windows, mais il porte les binaires natifs
# de TOUTES les plateformes (les 15 `@rolldown/binding-*`) — npm ≥ 10 les
# enregistre tous. C'est ce qui a permis de retirer le
# `npm install @rollup/rollup-linux-x64-gnu` de rattrapage qui vivait ici : il
# ne servait qu'à réparer un lockfile amputé. Si un jour `npm ci` échoue sur un
# binaire manquant, la réponse est de régénérer le lockfile, pas de revenir à
# `npm install`.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# URL PocketBase injectée au build (Vite inline les VITE_* dans le bundle)
ARG VITE_PB_URL
ENV VITE_PB_URL=${VITE_PB_URL}

# ⚠️ LES TROIS GARDE-FOUS PASSENT AVANT `vite build` (2026-09-09). Vite
# TRANSPILE le TypeScript sans jamais le vérifier : une erreur de types
# construisait une image parfaitement verte et partait en prod. Trois `RUN`
# séparés plutôt qu'un seul enchaînement : le log dit alors lequel a cassé
# sans qu'il faille le relire.
#
# ⚠️ Ne PAS les déplacer après le build « pour gagner du temps » : un build qui
# réussit après un test rouge est un build qu'on finit par publier.
RUN npm run typecheck
RUN npm run lint
RUN npm test

RUN npm run build

# ── Stage 2 : nginx ──────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
