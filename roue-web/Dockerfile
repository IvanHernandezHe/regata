# syntax=docker/dockerfile:1

FROM node:22-bookworm AS base
WORKDIR /usr/src/app
ENV NODE_ENV=development \
    NG_CLI_ANALYTICS=false

# Install dependencies first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application sources
COPY . .

# Development image used by docker-compose for the frontend
FROM base AS dev
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200", "--proxy-config", "proxy.docker.conf.json"]

# Production build stage to create static assets (optional but handy)
FROM base AS build
RUN npm run build

# Dedicated test runner stage for CI / docker compose profiles
FROM base AS test-runner
RUN apt-get update && apt-get install -y --no-install-recommends chromium && rm -rf /var/lib/apt/lists/*
ENV CHROME_BIN=/usr/bin/chromium
CMD ["npm", "run", "test", "--", "--watch=false", "--browsers=ChromeHeadless"]

# Serve built assets with nginx when a production image is required
FROM nginx:1.27-alpine AS production
COPY --from=build /usr/src/app/dist/roue-web/browser /usr/share/nginx/html
