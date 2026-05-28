#!/bin/bash
FORK_URL=$1
PORT=${2:-8545}
EXTRA_FLAGS=${3:-}

RUST_LOG=debug anvil \
  --print-traces \
  --disable-code-size-limit \
  --disable-min-priority-fee \
  --no-rate-limit \
  --hardfork prague \
  --fork-url "$FORK_URL" \
  --port "$PORT" \
  ${EXTRA_FLAGS}
