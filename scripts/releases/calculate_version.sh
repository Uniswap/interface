#!/bin/bash

# Calculate next version for mobile/extension releases
# Usage: ./calculate_version.sh <current_version> <format>
# Format: "mobile" (X.YY or X.YY.1) or "extension" (X.YY.0 or X.YY.1)
#
# Examples:
#   ./calculate_version.sh 1.64 mobile      → 1.64.1
#   ./calculate_version.sh 1.64.1 mobile    → 1.65
#   ./calculate_version.sh 1.64.0 extension → 1.64.1
#   ./calculate_version.sh 1.64.1 extension → 1.65.0

calculate_next_version() {
  local current=$1
  local format=$2  # "mobile" or "extension"

  # Check if version ends with .1
  if [[ $current == *.1 ]]; then
    # Current ends with .1 (e.g., 1.64.1)
    # Remove .1 to get base (e.g., 1.64)
    local base=${current%.1}

    # Extract major and minor from base
    local major=${base%.*}    # Everything before last dot: 1.64 -> 1
    local minor=${base##*.}   # Everything after last dot: 1.64 -> 64

    # Increment minor version
    local next_minor=$((minor + 1))

    if [ "$format" == "mobile" ]; then
      echo "$major.$next_minor"
    else
      echo "$major.$next_minor.0"
    fi
  else
    # Current is X.YY or X.YY.0, next is X.YY.1
    if [[ $current == *.0 ]]; then
      # Extension format: 1.65.0 -> 1.65.1
      echo "${current%.0}.1"
    else
      # Mobile format: 1.65 -> 1.65.1
      echo "$current.1"
    fi
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
