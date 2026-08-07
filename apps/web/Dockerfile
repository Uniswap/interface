# Build from repo root:
#   docker build -f apps/web/Dockerfile -t web-ecs \
#     --build-arg DEPLOYMENT_ENV=staging \
#     --build-arg ASSET_BASE_URL=https://cdn.uniswap.org/ \
#     --secret id=npm_token,env=NPM_READ_ONLY_TOKEN .
#
# Always pass --secret, even with NPM_READ_ONLY_TOKEN empty or unset
# (NPM_READ_ONLY_TOKEN="" docker build ...): BuildKit never cache-hits a
# RUN --mount=type=secret layer when the secret is omitted from the build
# command, so dropping the flag re-runs bun install on every build.

# bun install inputs only — every workspace package.json must be present or
# --frozen-lockfile fails ("lockfile had changes"). Collected by glob so new
# packages don't break the build. This stage re-runs on any source change
# (cheap), but the builder's COPY --from is keyed on /out's content, so the
# bun install layer stays cached until a manifest actually changes.
FROM public.ecr.aws/docker/library/alpine:3.22@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce AS manifests
WORKDIR /repo
COPY . .
RUN mkdir /out && \
    cp package.json bun.lock bunfig.toml .npmrc /out/ && \
    cp -R patches /out/patches && \
    find . -mindepth 2 -type f -name package.json ! -path '*/node_modules/*' | while read -r f; do \
      mkdir -p "/out/$(dirname "$f")" && cp "$f" "/out/$f" || exit 1; \
    done

FROM public.ecr.aws/docker/library/alpine:3.22@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce AS builder

# node: the nx ^prepare codegen bins and vite have #!/usr/bin/env node shebangs;
# the runtime stage stays bun-only.
RUN apk add --no-cache bash curl unzip libstdc++ libgcc git nodejs

# Checksum-verified release download (musl build for alpine), mirroring the
# runs-on.yml preinstall — never `curl | bash` an unpinned installer script.
# Bumping: keep in step with .bun-version; sha is bun-linux-x64-musl.zip's
# line in the release's SHASUMS256.txt.
ARG BUN_VERSION=1.3.14
ARG BUN_SHA256=14bd9aedeebf1dba67e8def9531c89bc989ecfdf1de42e5bfcaf1b8cd9294719
RUN curl -fsSL "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-x64-musl.zip" -o /tmp/bun.zip && \
    echo "${BUN_SHA256}  /tmp/bun.zip" | sha256sum -c - && \
    unzip -q /tmp/bun.zip -d /tmp && \
    mv /tmp/bun-linux-x64-musl/bun /usr/local/bin/bun && \
    ln -sf /usr/local/bin/bun /usr/local/bin/bunx && \
    rm -rf /tmp/bun.zip /tmp/bun-linux-x64-musl

WORKDIR /app

COPY --from=manifests /out/ ./
RUN --mount=type=secret,id=npm_token \
    if [ -s /run/secrets/npm_token ]; then \
      echo "//registry.npmjs.org/:_authToken=$(cat /run/secrets/npm_token)" > /app/.npmrc; \
    fi && \
    bun install --frozen-lockfile --ignore-scripts && \
    rm -f /app/.npmrc

ARG DEPLOYMENT_ENV=dev
ARG ASSET_BASE_URL=/
ARG DD_VERSION
ARG DISABLE_SOURCEMAP=false

# node_modules is dockerignored, so this does not clobber the install layer above.
COPY . .

# ECS clients call the entry gateway directly (like prod app.uniswap.org) instead of
# the same-origin /entry-gateway BFF proxy. .env.override is resolveEnvConfigs' top
# layer over the pulled .env; written post-COPY so the image is deterministic.
# ENVIRONMENT pins the bundle's env identity to the deployment env (the .env layer
# wins over vite's mode-based define) so a dev deploy resolves Environment.Development
# and routes to the dev entry gateway instead of inheriting staging from VITE_MODE.
RUN { printf 'ENABLE_ENTRY_GATEWAY_PROXY="false"\n'; \
      printf 'ENVIRONMENT="%s"\n' "$([ "$DEPLOYMENT_ENV" = "dev" ] && echo development || echo "$DEPLOYMENT_ENV")"; \
    } > apps/web/.env.override

ENV NODE_ENV=production
ENV DEPLOYMENT_ENV=${DEPLOYMENT_ENV}
ENV ASSET_BASE_URL=${ASSET_BASE_URL}
ENV DD_VERSION=${DD_VERSION}
ENV DISABLE_SOURCEMAP=${DISABLE_SOURCEMAP}
ENV GIT_COMMIT_HASH=${DD_VERSION}

# The pulled .env arrives only as a BuildKit secret mount — never COPY it (it would
# land in image layers and the pushed build cache). When absent, vite's
# resolveEnvConfigs falls back to the committed .env.dev defaults.
# config:pull needs Okta/OIDC — it always runs outside Docker (in CI).
ENV SKIP_CONFIG_PULL=true

# Secret contents are excluded from the BuildKit cache key; this non-secret hash
# busts the vite layer whenever the pulled config changes.
ARG WEB_ENV_SHA=

# --skip-sync: Dockerfile.dockerignore strips files the tsconfig-sync generator
# scans (e.g. **/*.test.ts), so its verification can never be sound in this
# truncated context. The checked-in tsconfigs are validated by PR CI.
RUN --mount=type=secret,id=web_env,target=/app/apps/web/.env \
    export VITE_MODE=$([ "$DEPLOYMENT_ENV" = "production" ] && echo production || echo staging) && \
    echo "[web Dockerfile] nx build web -c ecs (mode=$VITE_MODE ASSET_BASE_URL=$ASSET_BASE_URL WEB_ENV_SHA=$WEB_ENV_SHA)" && \
    NX_DAEMON=false NX_NO_CLOUD=true bun x nx build web -c ecs --skip-sync

FROM public.ecr.aws/docker/library/alpine:3.22@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce

RUN apk add --no-cache libstdc++ libgcc curl

COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun

RUN addgroup -g 1000 bun && adduser -u 1000 -G bun -s /bin/sh -D bun

WORKDIR /app

# ecs-entry.ts resolves ../client relative to build/server/index.mjs — keep the
# sibling layout.
COPY --from=builder --chown=bun:bun /app/apps/web/build/client ./build/client
COPY --from=builder --chown=bun:bun /app/apps/web/build/server ./build/server

ARG DD_VERSION
# builder-stage ENVs don't carry into this stage; ecs-entry reads DEPLOYMENT_ENV
# at runtime.
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
