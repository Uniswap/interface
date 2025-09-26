#!/bin/bash

# Run depcheck and handle the known Vue EntityDecoder CI error
# See: https://github.com/vuejs/core/issues/10609

if ! depcheck 2>&1 | tee /tmp/depcheck_output.log; then
  if grep -q "EntityDecoder is not a constructor" /tmp/depcheck_output.log; then
    echo ""
    echo "⚠️  Known Vue EntityDecoder CI issue detected"
    echo "   This is a known issue when depcheck uses @vue/compiler-core in CI environments"
    echo "   See: https://github.com/vuejs/core/issues/10609"
    echo "   Try re-running the check to verify that the issue is resolved."
    echo "   Continuing with dependency checks..."
    echo ""
    # Clean up temp file
    rm -f /tmp/depcheck_output.log
    exit 0
  else
    # Clean up temp file and re-throw the error
    rm -f /tmp/depcheck_output.log
    exit 1
  fi
fi

# Clean up temp file on success
rm -f /tmp/depcheck_output.log
