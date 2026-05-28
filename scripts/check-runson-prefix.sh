#!/bin/bash
# Validates that all RunsOn runner references in GitHub Actions workflows
# include the required `runs-on=` prefix. Without this prefix, GitHub
# silently falls back to a hosted runner instead of routing to RunsOn.
#
# Correct:   runs-on: runs-on=${{ github.run_id }}/runner=universe-light
# Incorrect: runs-on: ${{ github.run_id }}/runner=universe-light

set -euo pipefail

WORKFLOWS_DIR=".github/workflows"
EXIT_CODE=0

# Match lines with `runner=universe` (RunsOn pattern) but missing `runs-on=` prefix
while IFS= read -r file; do
  while IFS=: read -r lineno line; do
    # Strip leading whitespace for matching
    trimmed="${line#"${line%%[![:space:]]*}"}"

    # Skip comments
    [[ "$trimmed" == \#* ]] && continue

    # Must be a runs-on: line referencing a RunsOn runner
    if [[ "$trimmed" =~ ^runs-on: ]] && [[ "$trimmed" =~ runner=universe ]]; then
      # Check it has the runs-on= prefix after the YAML key
      if [[ ! "$trimmed" =~ ^runs-on:.*runs-on= ]]; then
        echo "❌ $file:$lineno — missing 'runs-on=' prefix"
        echo "   Found:    $trimmed"
        echo "   Expected: runs-on: runs-on=\${{ github.run_id }}/runner=..."
        echo ""
        EXIT_CODE=1
      fi
    fi
  done < <(grep -n "runner=universe" "$file" 2>/dev/null || true)
done < <(find "$WORKFLOWS_DIR" \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null)

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "✅ All RunsOn workflow references have the correct 'runs-on=' prefix."
fi

exit $EXIT_CODE
