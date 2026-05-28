#!/bin/bash

# Calculate next version for mobile/extension releases
# Usage: ./calculate_version.sh <current_version> <format>
# Format: "mobile" (X.YY) or "extension" (X.YY.0)
#
# With biweekly releases, every cut bumps the minor version.
# Patch versions (.1) are reserved for hotfixes only.
#
# Examples:
#   ./calculate_version.sh 1.70 mobile      → 1.71
#   ./calculate_version.sh 1.71 mobile      → 1.72
#   ./calculate_version.sh 1.70.0 extension → 1.71.0
#   ./calculate_version.sh 1.71.0 extension → 1.72.0
#
# Legacy .1 versions are handled gracefully (bumps to next minor):
#   ./calculate_version.sh 1.70.1 mobile    → 1.71
#   ./calculate_version.sh 1.70.1 extension → 1.71.0

calculate_next_version() {
  local current=$1
  local format=$2  # "mobile" or "extension"

  # Strip any patch suffix (X.YY.Z → X.YY) to get the base
  local base=$current
  if [[ $current =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    base=${current%.*}
  fi

  # Extract major and minor from base
  local major=${base%.*}    # Everything before last dot: 1.70 -> 1
  local minor=${base##*.}   # Everything after last dot: 1.70 -> 70

  # Increment minor version
  local next_minor=$((minor + 1))

  if [ "$format" == "mobile" ]; then
    echo "$major.$next_minor"
  else
    echo "$major.$next_minor.0"
  fi
}

# If script is run directly (not sourced), execute with arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [ $# -lt 2 ]; then
    echo "Usage: $0 <current_version> <format>" >&2
    echo "Format: mobile or extension" >&2
    exit 1
  fi
  calculate_next_version "$1" "$2"
fi
