# syntax=docker/dockerfile:1
#
# Agent Espacio Client — Next.js server (production)
# Multi-stage build. The Next.js server renders public pages server-side
# (SSR metadata, JSON-LD, semantic HTML) and serves Route Handlers for the
# agentic web layer (/llms.txt, /sitemap.xml, /robots.txt).
#
# The build is hermetic: public pages and route handlers are dynamic, so
# `next build` performs zero API calls. The API is only reached at runtime
# via NEXT_PUBLIC_API_URL (public URL — the client and API can live on
# different machines).

FROM node:24-alpine AS base
# Install dependencies only when we need them

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# BuildKit cache mount: npm's download cache persists between builds,
# so lockfile changes don't re-download the world on a 1-vCPU box.
RUN --mount=type=cache,target=/root/.npm npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time.
# Pass them through docker-compose build args (see docker-compose.yml).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_SITE_DESCRIPTION
ARG NEXT_PUBLIC_OG_IMAGE_URL
ARG NEXT_PUBLIC_FAVICON_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_SITE_DESCRIPTION=$NEXT_PUBLIC_SITE_DESCRIPTION
ENV NEXT_PUBLIC_OG_IMAGE_URL=$NEXT_PUBLIC_OG_IMAGE_URL
ENV NEXT_PUBLIC_FAVICON_URL=$NEXT_PUBLIC_FAVICON_URL

# Next's build cache persists between builds — incremental builds are
# dramatically faster (only changed pages recompile).
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
