#!/bin/bash

# Local submission wrapper for E2E performance metrics
# This script extracts metrics from the latest Maestro test and submits to Datadog

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAESTRO_LOGS_DIR="${MAESTRO_LOGS_DIR:-$HOME/.maestro/tests}"
METRICS_FILE="${1:-metrics.jsonl}"

echo "=== E2E Performance Metrics Submission (Local) ==="
echo ""

# Check if Datadog API key is set
if [ -z "$DATADOG_API_KEY" ]; then
  echo "⚠️  Warning: DATADOG_API_KEY not set"
  echo "   Metrics will be extracted but not submitted to Datadog"
  echo "   Set DATADOG_API_KEY environment variable to enable submission"
  echo ""
  DRY_RUN="--dry-run"
else
  echo "✅ Datadog API key found"
  DRY_RUN=""
fi

# Extract metrics from latest test logs
echo "Extracting metrics from Maestro logs..."
"$SCRIPT_DIR/extract-metrics.sh" "$MAESTRO_LOGS_DIR" "$METRICS_FILE"

# Check if metrics were extracted
if [ ! -s "$METRICS_FILE" ]; then
  echo "❌ No metrics found in logs"
  exit 1
fi

# Add local development tags
TAGS="env:local,source:manual"

# Add git branch if available
if git rev-parse --git-dir >/dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  TAGS="$TAGS,branch:$BRANCH"
fi

# Submit metrics
echo ""
echo "Submitting metrics..."
node "$SCRIPT_DIR/submit-metrics.js" \
  --file "$METRICS_FILE" \
  --tags "$TAGS" \
  $DRY_RUN

# Optionally clean up metrics file
if [ -z "$KEEP_METRICS_FILE" ]; then
  rm -f "$METRICS_FILE"
fi

echo ""
echo "✅ Done!"
