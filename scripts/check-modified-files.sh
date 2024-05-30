#!/bin/bash

DIFF=$(git --no-pager diff)

echo "${DIFF}"

# Fail if working tree has changes
if [ "$DIFF" ]; then
    echo "This step has modified files when it should not have!"
    exit 1;
fi

exit 0;
