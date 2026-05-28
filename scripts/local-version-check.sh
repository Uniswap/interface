#!/bin/bash

check() {
  if [[ "$2" != $3* ]]; then
    echo "Mismatched $1 version: Expected $3 but got $2"
    exit 1
  fi
}

# Check bun version
localBunVersion="$(bun --version)"
expectedBunVersion="$(cat "$(dirname "$0")/../.bun-version" | tr -d '\n')"
check "bun" $localBunVersion "$expectedBunVersion"

# Check Xcode version
localXcodeOutput="$(/usr/bin/xcodebuild -version)"
localXcodeVersion=$(echo "$localXcodeOutput" | awk '/Xcode/ {print $2}')
expectedXcodeVersion="$(cat "$(dirname "$0")/../.xcode-version" | tr -d '\n')"
check "Xcode" $localXcodeVersion "$expectedXcodeVersion"

# Check node version
localNodeVersion="$(node --version)"
expectedNodeVersion="$(cat "$(dirname "$0")/../.nvmrc" | tr -d '\n' | cut -d'.' -f1)"
check "node" $localNodeVersion "$expectedNodeVersion"

# Check ruby version
localRubyOutput="$(ruby --version)"
localRubyVersion=$(echo "$localRubyOutput" | awk '/ruby/ {print $2}')
expectedRubyVersion="$(cat "$(dirname "$0")/../.ruby-version" | tr -d '\n')"
check "ruby" $localRubyVersion "$expectedRubyVersion"

# Check cocoapods version
localPodVersion="$(cd "$(dirname "$0")/../apps/mobile" && bundle exec pod --version)"
expectedPodVersion="$(grep "gem 'cocoapods'" "$(dirname "$0")/../apps/mobile/Gemfile" | sed -E "s/.*'([0-9.]+)'.*/\1/")"
check "pod" $localPodVersion "$expectedPodVersion"

echo "All versions match!"
