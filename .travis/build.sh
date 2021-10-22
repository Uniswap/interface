#!/bin/bash

set -euo pipefail

printf 'Building swap from commit %s\n' "$TRAVIS_COMMIT"
if [[ "$TRAVIS_BRANCH" == "develop" ]]; then
  echo "Start running build-ropsten"
  yarn build-ropsten || true
  echo "Finished running build-ropsten"
  mv build build-ropsten
  echo "Start build prod"
  yarn build-production || true
  echo "Finish build prod"
elif [[ "$TRAVIS_BRANCH" == "staging" ]]; then
  echo "Start running build-staging"
  yarn build-staging
  echo "Finished running build-staging"
elif [[ "$TRAVIS_BRANCH" == "main" ]]; then
  echo "Start running build"
  yarn build-production
  echo "Finished running build"
else
    echo "Branch is not set for auto-build."
    exit 0
fi
