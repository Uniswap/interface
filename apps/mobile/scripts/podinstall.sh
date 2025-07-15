#!/bin/bash

set -e

REQUIRED_XCODE_VERSION="16.4"
UPDATE_REPOS=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--update)
      UPDATE_REPOS=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

check_xcode_version() {
  local current_version=$(xcodebuild -version | grep "Xcode" | cut -d' ' -f2)
  if [ "$current_version" != "$REQUIRED_XCODE_VERSION" ]; then
    echo "Error: Xcode version mismatch"
    echo "Required: $REQUIRED_XCODE_VERSION"
    echo "Current: $current_version"
    exit 1
  fi
  echo "Xcode version check passed: $current_version"
}

# Check Xcode version
check_xcode_version

# Install pods
cd ios/
bundle install
if [ "$UPDATE_REPOS" = true ]; then
  bundle exec pod install --repo-update
else
  bundle exec pod install
fi
cd ..
