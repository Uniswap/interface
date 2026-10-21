# Runtime-only image. The app is built on the CI runner first
# (apps/web/scripts/build-ecs.sh) and only apps/web/build enters the context
# (Dockerfile.dockerignore), so no bun install or vite runs in Docker.
#
#   DEPLOYMENT_ENV=staging ASSET_BASE_URL=https://cdn.staging.app.uniswap.org/ \
#     DD_VERSION=$(git rev-parse --short=7 HEAD) bash apps/web/scripts/build-ecs.sh
#   docker build -f apps/web/Dockerfile -t web-ecs --build-arg DEPLOYMENT_ENV=staging apps/web

FROM public.ecr.aws/docker/library/alpine:3.22@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce

RUN apk add --no-cache libstdc++ libgcc curl unzip

# Checksum-verified release download (musl build for alpine); never `curl | bash`
# an unpinned installer. Bumping: keep in step with .bun-version; sha is
# bun-linux-x64-musl.zip's line in the release's SHASUMS256.txt.
ARG BUN_VERSION=1.3.14
ARG BUN_SHA256=14bd9aedeebf1dba67e8def9531c89bc989ecfdf1de42e5bfcaf1b8cd9294719
RUN curl -fsSL "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64-musl.zip" -o /tmp/bun.zip && \
    echo "${BUN_SHA256}  /tmp/bun.zip" | sha256sum -c - && \
    unzip -q /tmp/bun.zip -d /tmp && \
    mv /tmp/bun-linux-x64-musl/bun /usr/local/bin/bun && \
    rm -rf /tmp/bun.zip /tmp/bun-linux-x64-musl

RUN addgroup -g 1000 bun && adduser -u 1000 -G bun -s /bin/sh -D bun

WORKDIR /app

# ecs-entry.ts resolves ../client relative to build/server/index.mjs — keep the
# sibling layout.
COPY --chown=bun:bun build/client ./build/client
COPY --chown=bun:bun build/server ./build/server

ARG DD_VERSION
# ecs-entry reads DEPLOYMENT_ENV at runtime.
ARG DEPLOYMENT_ENV=dev
ENV NODE_ENV=production
ENV PORT=3000
ENV DD_VERSION=${DD_VERSION}
ENV DEPLOYMENT_ENV=${DEPLOYMENT_ENV}

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost:${PORT:-3000}/health || exit 1

CMD ["bun", "run", "./build/server/index.mjs"]
