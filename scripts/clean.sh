#!/bin/bash
set -euo pipefail

# Restore the monorepo as close to a freshly cloned state as possible
# Usage: bun clean [--git] [--node] [--bun]
#   --git   Remove git untracked files (except for .env files, node_modules, and .claude directories)
#   --node  Remove all node_modules (instead of just local packages)
#   --bun   Clear the global bun cache

# Parse CLI arguments
GIT_CLEAN=false
NODE_MODULES=false
BUN_CACHE=false
HAS_CLI_ARGS=false

while [[ $# -gt 0 ]]; do
  HAS_CLI_ARGS=true
  case $1 in
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

# Only prompt if no CLI args were provided
if [ "$HAS_CLI_ARGS" = false ]; then
  prompt_yes_no "⚠️  UNTRACKED FILES: Do you want to remove all files untracked by git..." "GIT_CLEAN"
  prompt_yes_no "📦 NODE MODULES: Local packages will be cleaned. Do you also want to remove ALL other node_modules (slower but more thorough)?" "NODE_MODULES"
fi

# Execute git clean if confirmed
if [ "$GIT_CLEAN" = true ]; then
  echo "Removing all untracked files except for .env files..."
  git clean -fdx -e "**/.env*" -e "**/node_modules" -e "**/.claude"
fi

# Execute node_modules cleanup
if [ "$NODE_MODULES" = true ]; then
  echo "Removing node_modules..."
  bun run g:rm:nodemodules
else
  echo "Removing local packages..."
  bun run g:rm:local-packages
fi

# Clear global bun cache
if [ "$BUN_CACHE" = true ]; then
  echo "Clearing global bun cache..."
  bun pm cache rm
fi

# Install dependencies
echo "Installing dependencies..."
bun install

# Clear NX cache
echo "Clearing NX cache..."
bun nx reset
# Sync NX but silence errors because sometimes the first NX command
# after a reset fails due to a race condition with the NX daemon
bun nx sync 2>/dev/null || true

# Prepare packages
echo "Preparing packages..."
bun run g:prepare

echo "✅ Clean completed successfully!"
