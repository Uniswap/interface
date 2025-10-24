#!/bin/bash

# This script controls whether quality checks run in Github for a specific project
# Usage: ./checks-should-run.sh <project-name>
# Example: ./checks-should-run.sh @uniswap/mobile

if [ -z "$1" ]; then
  echo "Error: Project name is required"
  echo "Usage: $0 <project-name>"
  exit 1
fi

PROJECT_NAME="$1"

# Check if the specified project is affected by changes
bun nx show projects --affected --base=HEAD^ --head=HEAD | grep -q "$PROJECT_NAME"

# grep returns 0 if match found (project is affected), 1 if no match
exit_status=$?

echo "" # separate from the nx output

if [[ "$exit_status" == 0 ]] ; then
  echo "✅ - Proceed with checks for $PROJECT_NAME"
  echo "CONCLUSION=success" >> "$GITHUB_OUTPUT"
else
  echo "🛑 - Cancel checks for $PROJECT_NAME (not affected by changes)"
  echo "CONCLUSION=fail" >> "$GITHUB_OUTPUT"
fi

