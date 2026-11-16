# syntax=docker/dockerfile:1

# Production image for the Ledgerly web app: Vite builds the static files, Nginx serves them
# and forwards /api to the API container.

# ---- Build stage ----
FROM node:26-slim AS build
WORKDIR /app

# Retry flaky downloads instead of failing the whole build.
ENV NPM_CONFIG_FETCH_RETRIES=5 NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=2000 NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=30000 \
    NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# A production build talks to the real API at /api (the mock API is only for local UI work).
RUN npm run build

# ---- Runtime stage: Nginx that runs as a non-root user ----
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
