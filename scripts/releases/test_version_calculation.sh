#!/bin/bash

# Test script for version calculation logic
# Tests the calculate_version.sh script in scripts/releases/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source the actual script
source "$REPO_ROOT/scripts/releases/calculate_version.sh"

echo "Testing Mobile Version Calculations:"
echo "======================================"

test_cases_mobile=(
  "1.64:1.64.1"
  "1.64.1:1.65"
  "1.65:1.65.1"
  "1.65.1:1.66"
  "1.66:1.66.1"
)

for test in "${test_cases_mobile[@]}"; do
  input="${test%:*}"
  expected="${test#*:}"
  result=$(calculate_next_version "$input" "mobile")
  if [ "$result" == "$expected" ]; then
    echo "✅ $input → $result"
  else
    echo "❌ $input → $result (expected $expected)"
  fi
done

echo ""
echo "Testing Extension Version Calculations:"
echo "========================================"

test_cases_extension=(
  "1.64.0:1.64.1"
  "1.64.1:1.65.0"
  "1.65.0:1.65.1"
  "1.65.1:1.66.0"
  "1.66.0:1.66.1"
)

for test in "${test_cases_extension[@]}"; do
  input="${test%:*}"
  expected="${test#*:}"
  result=$(calculate_next_version "$input" "extension")
  if [ "$result" == "$expected" ]; then
    echo "✅ $input → $result"
  else
    echo "❌ $input → $result (expected $expected)"
  fi
done

echo ""
echo "Testing with actual latest releases:"
echo "===================================="

MOBILE_LATEST=$(git branch -r 2>/dev/null | grep 'origin/releases/mobile/' | grep -v 'dev' | sed 's/.*releases\/mobile\///' | sort -V | tail -1)
EXTENSION_LATEST=$(git branch -r 2>/dev/null | grep 'origin/releases/extension/' | grep -v 'dev' | sed 's/.*releases\/extension\///' | sort -V | tail -1)

if [ -n "$MOBILE_LATEST" ]; then
  MOBILE_NEXT=$(calculate_next_version "$MOBILE_LATEST" "mobile")
  MOBILE_NEXT_NEXT=$(calculate_next_version "$MOBILE_NEXT" "mobile")
  echo "Mobile: $MOBILE_LATEST → $MOBILE_NEXT → $MOBILE_NEXT_NEXT"
else
  echo "No mobile branches found (run git fetch)"
fi

if [ -n "$EXTENSION_LATEST" ]; then
  EXTENSION_NEXT=$(calculate_next_version "$EXTENSION_LATEST" "extension")
  EXTENSION_NEXT_NEXT=$(calculate_next_version "$EXTENSION_NEXT" "extension")
  echo "Extension: $EXTENSION_LATEST → $EXTENSION_NEXT → $EXTENSION_NEXT_NEXT"
else
  echo "No extension branches found (run git fetch)"
fi
