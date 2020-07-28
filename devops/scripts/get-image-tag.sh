#!/usr/bin/env bash

if [ ! -z "$CIRCLE_BRANCH" ] && [ ! -z "$CIRCLE_WORKFLOW_ID" ]; then
  echo ${CIRCLE_BRANCH}-ci-${CIRCLE_WORKFLOW_ID}
  exit 0
fi

CURRENT_BRANCH=`$(dirname $0)/get-current-branch.sh`
CURRENT_SHA=`git show --oneline | head -n 1 | cut -d ' ' -f 1`

echo ${CURRENT_BRANCH}-local-${CURRENT_SHA}
