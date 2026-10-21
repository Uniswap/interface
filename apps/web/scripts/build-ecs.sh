#!/usr/bin/env bash
# Builds the web ECS bundle (apps/web/build/{client,server}) on the CI runner, so the
# Docker image only has to COPY it. Run from the repo root.
#
# Required env: DEPLOYMENT_ENV (dev|staging|production), ASSET_BASE_URL, DD_VERSION.
# Optional: VERSION — the release version the bundle must report (checked after the build).
set -euo pipefail
: "${DEPLOYMENT_ENV:?}" "${ASSET_BASE_URL:?}" "${DD_VERSION:?}"

# ECS clients call the entry gateway directly instead of the same-origin BFF proxy, and
# ENVIRONMENT pins the bundle's env identity to the deployment env. Both go through
# .env.override because the pulled .env layer wins over process.env (resolveEnvConfigs).
environment=$([ "$DEPLOYMENT_ENV" = dev ] && echo development || echo "$DEPLOYMENT_ENV")
printf 'ENABLE_ENTRY_GATEWAY_PROXY="false"\nENVIRONMENT="%s"\n' "$environment" > apps/web/.env.override

export NODE_ENV=production
export GIT_COMMIT_HASH="$DD_VERSION"
export VITE_MODE=$([ "$DEPLOYMENT_ENV" = production ] && echo production || echo staging)
echo "[build-ecs] nx build web -c ecs (mode=$VITE_MODE ASSET_BASE_URL=$ASSET_BASE_URL)"
# --skip-sync: PR CI already validates the tsconfig references; a deploy must not fail on them.
bun nx build web -c ecs --skip-sync

# Datadog matches sourcemaps on service + version, so the bundle's version.json must
# equal the release VERSION the upload is filed under.
if [ -n "${VERSION:-}" ]; then
  built=$(bun -e 'console.log(require("./apps/web/build/client/version.json").version)')
  if [ "$built" != "$VERSION" ]; then
    echo "::error::bundle version '$built' != VERSION '$VERSION'"
    exit 1
  fi
fi
