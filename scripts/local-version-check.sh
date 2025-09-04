#!/bin/bash

check() {
  if [[ "$2" != $3* ]]; then
    echo "Mismatched $1 version: Expected $3 but got $2"
    exit 1
  fi
}

# Check bun version
localBunVersion="$(bun --version)"
check "bun" $localBunVersion "1.2"

# Check Xcode version
localXcodeOutput="$(/usr/bin/xcodebuild -version)"
localXcodeVersion=$(echo "$localXcodeOutput" | awk '/Xcode/ {print $2}')
check "Xcode" $localXcodeVersion "16.4"

# Check node version
localNodeVersion="$(node --version)"
check "node" $localNodeVersion "v22"

# Check ruby version
localRubyOutput="$(ruby --version)"
localRubyVersion=$(echo "$localRubyOutput" | awk '/ruby/ {print $2}')
check "ruby" $localRubyVersion "3.2.2"

# Check cocoapods version
localPodVersion="$(cd apps/mobile && bundle exec pod --version cd ../..)"
check "pod" $localPodVersion "1.14.3"

echo "All versions match!"
