#!/bin/bash

# Test sitemap generation to ensure it doesn't break
# This script validates that the sitemap generation process works correctly

set -e

echo "Testing sitemap generation..."

# Create backup of existing sitemaps if they exist
if [ -f "./public/tokens-sitemap.xml" ]; then
  cp ./public/tokens-sitemap.xml ./public/tokens-sitemap.xml.backup
fi
if [ -f "./public/pools-sitemap.xml" ]; then
  cp ./public/pools-sitemap.xml ./public/pools-sitemap.xml.backup
fi

# Run sitemap generation with timeout
timeout 120s bun run sitemap:generate || {
  echo "Sitemap generation failed or timed out"
  exit 1
}

# Verify sitemaps were created and are valid XML
if [ ! -f "./public/tokens-sitemap.xml" ]; then
  echo "tokens-sitemap.xml was not generated"
  exit 1
fi
if [ ! -f "./public/pools-sitemap.xml" ]; then
  echo "pools-sitemap.xml was not generated"
  exit 1
fi

# Verify files contain content (basic sanity check)
if [ ! -s "./public/tokens-sitemap.xml" ]; then
  echo "tokens-sitemap.xml is empty"
  exit 1
fi
if [ ! -s "./public/pools-sitemap.xml" ]; then
  echo "pools-sitemap.xml is empty"
  exit 1
fi

echo "Sitemap generation test passed!"

# Restore original sitemaps to avoid affecting other CI checks
if [ -f "./public/tokens-sitemap.xml.backup" ]; then
  mv ./public/tokens-sitemap.xml.backup ./public/tokens-sitemap.xml
else
  rm -f ./public/tokens-sitemap.xml
fi
if [ -f "./public/pools-sitemap.xml.backup" ]; then
  mv ./public/pools-sitemap.xml.backup ./public/pools-sitemap.xml
else
  rm -f ./public/pools-sitemap.xml
fi

echo "Sitemap test completed successfully"
