#!/usr/bin/env bash

if [ -z "$CIRCLE_BRANCH" ]; then
  CURRENT_BRANCH=`git rev-parse --abbrev-ref HEAD`
else
  CURRENT_BRANCH=$CIRCLE_BRANCH
fi

CURRENT_BRANCH=${CURRENT_BRANCH//-/_} # Replace - with _

echo $CURRENT_BRANCH # To uppercase
