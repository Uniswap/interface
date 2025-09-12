#!/bin/bash

entry=$1
expected=$2

out=$(bunx madge -c $entry 2>&1)

if [[ "$expected" == "0" ]]; then
    if [[ "$out" == *"No circular dependency found"* ]]; then
        echo "Passed!"
        echo ""
        echo "$out"
        exit 0
    else
        echo "Failed: expected $expected circular deps, but found some"
        echo ""
        echo "$out"
        exit 1
    fi
elif [[ "$out" == *"Found $expected circular dependencies"* || "$out" == *"Found $expected circular dependency"* ]]; then
    echo "Passed!"
    echo ""
    echo "$out"
    exit 0
else
    echo "Failed: expected $expected circular deps"
    echo ""
    echo "$out"
    exit 1
fi
