#!/bin/bash

# This script controls whether the web quality checks run in Github

# Check if @universe/web is affected by changes
bun nx show projects --affected --base=HEAD^ --head=HEAD | grep -q "@universe/web"

# grep returns 0 if match found (project is affected), 1 if no match
exit_status=$?

echo "" # separate from the nx output

if [[ "$exit_status" == 0 ]] ; then
  echo "✅ - Proceed"
  echo "CONCLUSION=success" >> "$GITHUB_OUTPUT"
else
  echo "🛑 - Cancel"
  echo "CONCLUSION=fail" >> "$GITHUB_OUTPUT"
fi
