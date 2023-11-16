#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# wtf vercel so successful exit (0) = cancel build
#                    error exit (1) = run build
# ????
# https://vercel.com/guides/how-do-i-use-the-ignored-build-step-field-on-vercel

if [[ "$VERCEL_GIT_COMMIT_REF" == "interface" ]] ; then
  echo "✅ - Build can proceed"
  exit 1;
else
  echo "🛑 - Build cancelled"
  exit 0;
fi
