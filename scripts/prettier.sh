#!/bin/bash

# Default check
mode="-c"

# Can change to write with "--write"
if [[ "$1" == "--write" ]]; then
  mode="-w"
fi

# Store the directory from which the script was called
CALLER_DIR="$(pwd)"

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script directory
cd "$SCRIPT_DIR/.."

./node_modules/.bin/prettier $mode $CALLER_DIR --ignore-path .prettierignore
