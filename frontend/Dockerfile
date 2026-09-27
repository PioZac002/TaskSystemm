# syntax=docker/dockerfile:1

# ── Build: production bundle with Vite ─────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
# Empty = same origin: the browser calls /api on the address it loaded the app from,
# and nginx below forwards it to the backend. Set a full URL to call a remote API instead.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ── Runtime: nginx serves the bundle and proxies /api ──────────────────────────
FROM nginx:1.27-alpine

# Rendered to /etc/nginx/conf.d/default.conf at container start (envsubst)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:6901

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
