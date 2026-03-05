#!/bin/bash
set -euo pipefail

# Restore the monorepo as close to a freshly cloned state as possible
# Usage: bun clean [--git] [--node] [--bun]
#   --git   Remove git untracked files (except for .env files, node_modules, and .claude directories)
#   --node  Remove all node_modules (instead of just local packages)
#   --bun   Clear the global bun cache
#   --quick Quick, basic clean that only removes temporary files

# Parse CLI arguments
GIT_CLEAN=false
NODE_MODULES=false
BUN_CACHE=false
HAS_CLI_ARGS=false

while [[ $# -gt 0 ]]; do
  HAS_CLI_ARGS=true
  case $1 in
    --quick)
      shift
      ;;
    --git)
      GIT_CLEAN=true
      shift
      ;;
    --node)
      NODE_MODULES=true
      shift
      ;;
    --bun)
      BUN_CACHE=true
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 [--git] [--node] [--bun]"
      exit 1
      ;;
  esac
done

prompt_yes_no() {
  local message=$1
  local var_name=$2
  echo "$message"
  read -p "(y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    eval "$var_name=true"
  fi
}

echo "This script will automatically remove build artifacts and caches."

# Only prompt if no CLI args were provided
if [ "$HAS_CLI_ARGS" = false ]; then
  echo "For a more thorough reset, you can use the following options:"
  prompt_yes_no "⚠️  UNTRACKED FILES: Do you want to remove all files untracked by git (except .env files)?" "GIT_CLEAN"
  prompt_yes_no "📦 NODE MODULES: Local packages will be cleaned. Should ALL other node_modules be removed (slower but more thorough)?" "NODE_MODULES"
  prompt_yes_no "🗑️  BUN CACHE: Do you want to clear the global bun cache (force re-download of dependencies)?" "BUN_CACHE"
fi

# Stop NX daemon and reset the cache
echo "Clearing NX cache..."
bun nx daemon --stop 2>/dev/null || true
bun nx reset || true

# Always remove specific build artifacts and cache directories
echo "Removing build artifacts and cache directories..."
# Remove build artifacts dirs in apps
rm -rf dist apps/web/.wrangler apps/extension/.output
# Remove the extension's WXT artifacts but NOT the chrome data dir
find apps/extension/.wxt -mindepth 1 -maxdepth 1 ! -name 'chrome-data' -exec sh -c 'echo "Removing $1" && rm -rf "$1"' _ {} \; 2>/dev/null || true
# Remove nested node_modules dirs (note, the root ./node_modules will not be affected here)
find . -path "./node_modules" -prune -o -type d -name "node_modules" -exec sh -c 'echo "Removing $1" && rm -rf "$1"' _ {} \; 2>/dev/null || true
# Remove tsbuildinfo files (except those in node_modules)
find . -path "./node_modules" -prune -o -type f -name "tsconfig.tsbuildinfo" -exec sh -c 'echo "Removing $1" && rm -f "$1"' _ {} \; 2>/dev/null || true

# Execute git clean if confirmed
if [ "$GIT_CLEAN" = true ]; then
  echo "Removing all untracked files except for .env files..."
  git clean -fdx -e "**/.env*" -e "**/node_modules" -e "**/.claude"
fi

# Clear global bun cache
if [ "$BUN_CACHE" = true ]; then
  echo "Clearing global bun cache..."
  bun pm cache rm
fi

# Execute node_modules cleanup
if [ "$NODE_MODULES" = true ]; then
  echo "Removing node_modules..."
  # Recursively remove all node_modules directories
  bun run g:rm:nodemodules
else
  echo "Removing local packages..."
  # Remove only the symlinks for the local packages
  bun run g:rm:local-packages
fi

# Install dependencies (with NX daemon disabled to avoid conflicts)
echo "Installing dependencies..."
NX_DAEMON=false bun install || {
  # Race conditions are possible with the NX daemon when node_modules
  # are removed. Retry once if install fails.
  echo "First install attempt failed, retrying..."
  sleep 2
  bun install
}

# Clear NX cache and restart daemon
echo "Restarting NX daemon..."
bun nx daemon --start 2>/dev/null || true  # Restart the daemon
bun nx sync 2>/dev/null || true

# If all artifacts were removed, run prepare to auto-generate files
if [ "$GIT_CLEAN" = true ]; then
  echo "Preparing packages..."
  bun run g:prepare
fi

echo "✅ Clean completed successfully!"
