#!/usr/bin/env bash

CURRENT_BRANCH=`./devops/scripts/get-current-branch.sh`

CURRENT_BRANCH=${1:-$CURRENT_BRANCH}

echo "Setting env: $CURRENT_BRANCH"

docker build \
  --build-arg CURRENT_BRANCH=$CURRENT_BRANCH \
  -t roll-uniswap-exchange \
  .
