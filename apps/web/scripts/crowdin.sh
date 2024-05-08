#!/bin/bash

if [ -n "$ONLY_IF_MISSING" ]; then
  if [ -e "$file" ]; then
    echo "Translation exist already, skipping download"
    exit 0
  fi
fi

if [ ! -e "$file" ]; then
    echo "File does not exist."
    # Do something here, for example:
    # touch "$file"  # Create the file
else
    echo "File exists."
fi

# install in CI
if ! which crowdin >/dev/null 2>&1; then
    echo "Installing"
    npm i -g @crowdin/cli@3.14.0
fi

if [ -n "$CROWDIN_WEB_ACCESS_TOKEN" ]; then
  echo "Running crowdin $@ for project ID: $CROWDIN_WEB_PROJECT_ID"
  npx crowdin "$@"
else
  echo "Running crowdin using dotenv"
  npx dotenv -e ../../.env.defaults.local -- npx crowdin "$@"
fi
