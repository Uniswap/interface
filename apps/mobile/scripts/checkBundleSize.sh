#!/bin/bash
MAX_SIZE=20.5

# Check OS type and use appropriate stat command
if [[ "$OSTYPE" == "darwin"* ]]; then
  # MacOS
  BUNDLE_SIZE=$(stat -f %z ios/main.jsbundle | awk '{print $1/1024/1024}')
else
  # Linux and others
  BUNDLE_SIZE=$(stat --format=%s ios/main.jsbundle | awk '{print $1/1024/1024}')
fi

if (($(echo "$BUNDLE_SIZE > $MAX_SIZE" | bc -l))); then
  echo "Bundle size ($BUNDLE_SIZE MB) exceeds limit ($MAX_SIZE MB). If you are adding new dependencies or files and see an increase of the bundle size by > 0.5MB, please check with the team. Otherwise you can bump the max size in the script by 0.5MB."
  exit 1
else
  echo "✅ Bundle size ($BUNDLE_SIZE MB) is within limit ($MAX_SIZE MB)"
fi
