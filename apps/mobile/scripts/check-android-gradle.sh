#!/bin/bash

# This script warns users if they need to sync Gradle
# It's designed to be used with NX caching - NX will only run this
# when Android Gradle files change

# Detect if we're in a workspace (monorepo) by checking for workspace root
# Script runs from apps/mobile, so check if ../../nx.json exists (workspace root)
if [ -f "../../nx.json" ]; then
  # We're in a workspace, user likely runs commands from root
  ANDROID_CMD="bun mobile android"
else
  # We're not in a workspace, user runs commands from mobile dir
  ANDROID_CMD="bun android"
fi

echo "⚠️  Warning: Android Gradle files have changed since last build"
echo ""
echo "You may encounter issues when running the Android app."
echo "To fix this, run one of the following:"
echo "  • $ANDROID_CMD        (build Android app, which will sync Gradle automatically)"
echo ""
echo "Metro bundler will continue starting, but you should build the Android app before"
echo "attempting to run it to ensure Gradle dependencies are synced."

