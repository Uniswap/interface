#!/bin/bash

# This script controls whether the web app builds for Vercel

# It has a Very Strange API surface
# https://vercel.com/guides/how-do-i-use-the-ignored-build-step-field-on-vercel
# successful exit (0) = cancel build
# error exit (1) = run build

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# For now we're running web builds always:

echo "✅ - Build can proceed"
exit 1;

# Example of ignoring based on a branch:

# if [[ "$VERCEL_GIT_COMMIT_REF" == "interface" ]] ; then
#   echo "✅ - Build can proceed"
#   exit 1;
# else
#   echo "🛑 - Build cancelled"
#   exit 0;
# fi
