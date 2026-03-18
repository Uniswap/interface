#!/bin/bash
set -e

echo "🧪 Benchmarking TypeScript Compilers"
echo "====================================="
echo ""

# Benchmark tsc
echo "🧹 Cleaning cache..."
bun clean --quick
bun g:prepare
echo "⏱️  Running tsc..."
START=$(date +%s)
bun g:typecheck > /tmp/tsc-output.txt 2>&1
TSC_EXIT=$?
END=$(date +%s)
TSC_TIME=$((END - START))

# Benchmark tsgo
echo "🧹 Cleaning cache..."
bun clean --quick
bun g:prepare
echo "⏱️  Running tsgo..."
START=$(date +%s)
bun g:typecheck:tsgo > /tmp/tsgo-output.txt 2>&1
TSGO_EXIT=$?
END=$(date +%s)
TSGO_TIME=$((END - START))

# Calculate speedup
if [ $TSGO_TIME -eq 0 ]; then
  SPEEDUP="N/A"
else
  SPEEDUP=$(awk "BEGIN {printf \"%.1f\", $TSC_TIME / $TSGO_TIME}")
fi

echo ""
echo "📊 Results:"
echo "  tsc:  ${TSC_TIME}s (exit: $TSC_EXIT)"
echo "  tsgo: ${TSGO_TIME}s (exit: $TSGO_EXIT)"
echo "  ⚡ Speedup: ${SPEEDUP}x faster"

# Compare outputs
if diff -q /tmp/tsc-output.txt /tmp/tsgo-output.txt > /dev/null 2>&1; then
    echo "✅ Output is identical"
else
    echo "⚠️  Output differs - review /tmp/tsc-output.txt and /tmp/tsgo-output.txt"
fi
