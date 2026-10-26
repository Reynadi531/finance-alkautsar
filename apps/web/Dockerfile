# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.4.2
ARG NODE_VERSION=24

# Everything shipped is plain JS, so the build stages run natively on the build host and
# the runtime stage only copies files — multi-arch images need no emulation
FROM --platform=$BUILDPLATFORM oven/bun:${BUN_VERSION}-alpine AS builder
WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

ENV NODE_ENV=production
# varlock validates the schema at build time; auto-load mode resolves real values on boot
# and bakes no sensitive values, so placeholders keep the image free of secrets
RUN cd apps/web && \
    BETTER_AUTH_SECRET=build-placeholder-build-placeholder \
    BETTER_AUTH_URL=http://localhost:3001 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    S3_ACCESS_KEY_ID=build \
    S3_SECRET_ACCESS_KEY=build \
    bun run build
# varlock runs codegen decorators on every load; the runtime has no src/ to write to
RUN sed '/@generateTsTypes/d' apps/web/.env.schema > apps/web/.env.schema.runtime

# Nitro bundles the server, but varlock's auto-load shells out to its CLI on boot
# to resolve env against .env.schema
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS varlock
# Keep in sync with the varlock catalog version in the root package.json
ARG VARLOCK_VERSION=1.18.0
RUN npm install --prefix /opt/varlock --omit=optional --no-package-lock varlock@${VARLOCK_VERSION}

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
# varlock's native helper only backs local keychain encryption, and resolving it chmods
# root-owned files (and picks the win32 helper on WSL2 hosts)
ENV _VARLOCK_FORCE_FILE_ENCRYPTION_FALLBACK=1

# auto-load finds the CLI by walking up from the cwd to node_modules/.bin/varlock
COPY --from=varlock /opt/varlock/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/web/.output ./.output
COPY --from=builder --chown=node:node /app/apps/web/.env.schema.runtime ./.env.schema

USER node
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
