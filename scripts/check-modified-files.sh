#!/bin/bash

DIFF=$(git --no-pager diff)

echo "${DIFF}"

# Fail if working tree has changes
if [ "$DIFF" ]; then
    echo "This branch has not updated our generated strings/translations file. Please run yarn i18n:extract"
    exit 1;
fi

exit 0;