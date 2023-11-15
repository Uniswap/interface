#!/bin/bash

if [ "$VERCEL_GIT_COMMIT_REF" == "interface" ]; then
  exit 1;
else
  exit 0;
fi
