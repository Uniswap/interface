# HookSwap data-api — plain long-running Node server (VPS target), Connect-RPC / protobuf.
# Build:  docker build -t hookswap-data-api .
# Run:    docker run --env-file .env -p 4092:4092 hookswap-data-api
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
EXPOSE 4092
# Health: GET /health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4092/health || exit 1
CMD ["node", "dist/server.js"]
