# syntax=docker/dockerfile:1

# Production image for the Ledgerly API.
# Node 26 runs the TypeScript sources directly (native type stripping), so there is no compile step.
# The same image is used for the API and for the one-off migration job (see compose.yaml).

# ---- Build stage: install production dependencies and generate the Prisma Client ----
FROM node:26-slim AS build
WORKDIR /app

# Retry flaky downloads instead of failing the whole build.
ENV NPM_CONFIG_FETCH_RETRIES=5 NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=2000 NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=30000 \
    NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false

COPY package.json package-lock.json ./
# Exact versions from the lockfile. Prisma is a regular dependency because the migration job needs its CLI.
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src ./src

# ---- Runtime stage ----
FROM node:26-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Prisma's migration engine needs OpenSSL; the slim image does not ship it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app ./

# Never run as root.
USER node
EXPOSE 4000

# Healthy only when the API can reach the database (readiness), so dependants wait for a working API.
HEALTHCHECK --interval=15s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health/ready').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "src/server.ts"]
