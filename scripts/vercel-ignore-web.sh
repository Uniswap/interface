#!/bin/bash

echo "on: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" == "interface" ]; then
  exit 1;
else
  exit 0;
fi
