#!/bin/bash

# This script controls whether the web quality checks run in Github

# see: https://github.com/vercel/turbo/blob/main/packages/turbo-ignore/README.md
npx turbo-ignore @uniswap/interface --fallback=HEAD^

# we get exit 1 if, in the diff of the current branch vs main,
# there was a change in web (or a sub-dependency of web)
exit_status=$?

echo "" # separate from the turbo output

if [[ "$exit_status" == 1 ]] ; then
  echo "✅ - Proceed"
  echo "CONCLUSION=success" >> "$GITHUB_OUTPUT"
else
  echo "🛑 - Cancel"
  echo "CONCLUSION=fail" >> "$GITHUB_OUTPUT"
fi
