#!/bin/bash

# This script warns users if they need to run pod install
# It's designed to be used with NX caching - NX will only run this
# when Podfile or Podfile.lock changes

# Detect if we're in a workspace (monorepo) by checking for workspace root
# Script runs from apps/mobile, so check if ../../nx.json exists (workspace root)
if [ -f "../../nx.json" ]; then
  # We're in a workspace, user likely runs commands from root
  IOS_CMD="bun mobile ios"
else
  # We're not in a workspace, user runs commands from mobile dir
  IOS_CMD="bun ios"
fi

echo "⚠️  Warning: Podfile or Podfile.lock has changed since last pod install"
echo ""
echo "You may encounter issues when running the iOS app."
echo "To fix this, run:"
echo "  • $IOS_CMD        (build iOS app, which will install pods automatically)"
echo ""
echo "Metro bundler will continue starting, but you should build the iOS app before"
echo "attempting to run it to ensure pods are installed."

