# HookSwap Trading API adapter — plain long-running Node/Express server (VPS target).
# Build:  docker build -t hookswap-trading-api-adapter .
# Run:    docker run --env-file .env --env-file config/rpc.env -p 4000:4000 hookswap-trading-api-adapter
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
# NOTE: no lockfile committed (installs deferred); use `npm install` on first build.
RUN npm install
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4000
# Health: GET /health  (reports routing mode)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/server.js"]
