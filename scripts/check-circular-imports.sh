#!/bin/bash

entry=$1
expected=$2

out=$(npx madge -c $entry 2>&1)


if [[ "$out" == *"Found $expected circular dependencies"* ]]; then
  echo "Passed!"
  echo ""
  echo "$out"
  exit 0
else
  echo "Failed: expected $2 circular deps"
  echo ""
  echo "$out"
  exit 1
fi
