#!/bin/bash

# This script controls whether quality checks run in Github for a specific project
# Use nx-set-shas to set NX_BASE and NX_HEAD environment variables before running this script
# Usage: ./checks-should-run.sh <project-name>
# Example: ./checks-should-run.sh @uniswap/mobile

if [ -z "$1" ]; then
  echo "Error: Project name is required"
  echo "Usage: $0 <project-name>"
  exit 1
fi

PROJECT_NAME="$1"

# Always run all checks for merge queue branches (gtmq*)
# On merge queue we force tests to run, but also check if the project is truly
# affected so workflows can post "Skipped" codecov statuses for unaffected projects.
# Note: Spoofed commit statuses (StatusContext) from GitHub Actions ARE accepted
# by the merge queue — only CheckRuns are subject to app_id restrictions.
BRANCH_NAME="${GITHUB_HEAD_REF:-}"
if [[ "$BRANCH_NAME" == gtmq* ]]; then
  echo "✅ - Merge queue branch detected ($BRANCH_NAME), running all checks"
  echo "CONCLUSION=success" >> "$GITHUB_OUTPUT"

  # Check if project is actually affected (used by codecov skip notifications)
  if [ -z "$NX_BASE" ]; then
    export NX_BASE="origin/main"
  fi
  bun nx show projects --affected | grep -q "$PROJECT_NAME"
  if [[ $? -eq 0 ]]; then
    echo "AFFECTED=true" >> "$GITHUB_OUTPUT"
  else
    echo "AFFECTED=false" >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

# Check if the specified project is affected by changes
# Use origin/main as fallback if NX_BASE is empty (nx-set-shas couldn't find previous successful run)
if [ -z "$NX_BASE" ]; then
  export NX_BASE="origin/main"
fi
bun nx show projects --affected | grep -q "$PROJECT_NAME"

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

