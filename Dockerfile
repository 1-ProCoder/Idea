# FlowFix AI — API service image.
#
# Multi-stage build for the @flowfix/api service. Uses the repo root as
# build context so npm workspaces resolve correctly. Generates the
# Prisma client, compiles TypeScript, then ships a slim Debian runtime
# image that applies pending migrations on every boot before starting
# Node. Railway's releaseCommand (`railway.toml`) ALSO runs
# `prisma migrate deploy` once per deploy — the runtime CMD is a
# safety net for local docker runs and crash-restart loops.

# ─── Stage 1: install workspaces (cache-friendly) ────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /repo

# Manifests first so Docker caches the install layer across source edits.
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# --ignore-scripts prevents Prisma's postinstall (which requires the
# schema) from running here; we generate in the build stage instead.
RUN npm ci --no-audit --no-fund --ignore-scripts

# ─── Stage 2: build the API + Prisma client ──────────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# Generate the Prisma client (`binaryTargets = ["native"]` works on
# Debian-slim). Without this, the @prisma/client import in
# apps/api/dist/index.js won't resolve at runtime.
RUN cd apps/api && npx prisma generate

# Compile TypeScript → apps/api/dist.
RUN cd apps/api && npm run build

# ─── Stage 3: runtime image ─────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Production node_modules (workspace symlinks for @flowfix/shared stay
# intact; they resolve via the relative `../../packages/shared` target).
COPY --from=build /repo/node_modules ./node_modules

# Compiled API.
COPY --from=build /repo/apps/api/dist ./apps/api/dist

# Prisma schema + migrations (needed for `prisma migrate deploy`).
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma

# The shared package is consumed by source via the workspace symlink.
# Drop the real directory at /app/packages/shared so the symlink target
# resolves correctly inside this image.
COPY --from=build /repo/packages/shared /app/packages/shared

WORKDIR /app/apps/api
EXPOSE 4000

# Apply pending Prisma migrations then start the API. `migrate deploy`
# is idempotent — no-op when the database is up-to-date.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
