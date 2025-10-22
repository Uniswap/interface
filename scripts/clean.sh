#!/bin/bash
set -euo pipefail

# Restore the monorepo as close to a freshly cloned state as possible (except for the .env files)

# Safety check - confirm with user before proceeding
echo "⚠️  WARNING: This will remove ALL untracked files and directories from your repository!"
echo "Only .env files will be preserved."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 1
fi

# Remove all untracked files
echo "Removing all untracked files..."
git clean -fdx -e "**/.env*"

# Remove node_modules
echo "Removing node_modules..."
bun run g:rm:nodemodules

# Install dependencies
echo "Installing dependencies..."
bun install

# Clear NX cache
echo "Clearing NX cache..."
bun nx reset

# Prepare packages
echo "Preparing packages..."
bun run g:prepare

echo "✅ Clean completed successfully!"
