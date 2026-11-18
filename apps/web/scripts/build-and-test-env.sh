#!/bin/bash

# Build production and test that environment variables are loaded correctly
# This prevents regression of the NX environment loading bug
# 
# This script serves dual purposes:
# 1. Builds the web app for production
# 2. Verifies that .env.production overrides are loaded correctly
#
# Note: this must be run in the apps/web directory

# Check that we're in the correct directory (apps/web)
if [[ ! -f "package.json" ]] || [[ ! -f "vite.config.mts" ]] || [[ ! -d "src" ]]; then
    echo "❌ Error: This script must be run from the apps/web directory"
    echo "Usage: cd apps/web && ./scripts/build-and-test-env.sh"
    exit 1
fi

echo "🧪 Testing production environment variable loading..."

# Run production build and capture output
BUILD_OUTPUT=$(NODE_OPTIONS="--max-old-space-size=16384" bun run build:production 2>&1)

# Check that the production remote config scope is loaded: ENV_CANARY is set to `production`
# there and nowhere else, and exists only for this check
if echo "$BUILD_OUTPUT" | grep -q "ENV_LOADED:.*mode=production.*ENV_CANARY=production$"; then
    echo "✅ Production config scope loaded correctly"
    echo "✅ Environment loading test PASSED"
    exit 0
else
    echo "❌ Production environment variables not loaded correctly"
    echo "Expected: mode=production with ENV_CANARY=production (Mission Control: web, production scope)"
    echo "Build output:"
    echo "$BUILD_OUTPUT" | grep "ENV_LOADED:" || echo "No ENV_LOADED found"
    echo "❌ Environment loading test FAILED"
    exit 1
fi
