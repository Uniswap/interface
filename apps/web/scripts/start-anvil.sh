#!/bin/bash
# Starts a local anvil fork for e2e tests and manual testing.
#
# Usage: ./start-anvil.sh <mainnet|base> [extra anvil flags...]
#
# Forks from PublicNode, a free unkeyed public RPC. UniRPC can't serve anvil
# (it 401s cookieless/session-less requests) and the QuickNode endpoint
# formerly used here has its mainnet methods paused due to abuse.
# Override with ANVIL_FORK_URL / ANVIL_FORK_URL_BASE; keep in sync with
# DEFAULT_MAINNET_FORK_URL in src/playwright/anvil/anvil-manager.ts.

CHAIN=$1
shift

case "$CHAIN" in
  mainnet)
    FORK_URL="${ANVIL_FORK_URL:-https://ethereum-rpc.publicnode.com}"
    PORT=8545
    ;;
  base)
    FORK_URL="${ANVIL_FORK_URL_BASE:-https://base-rpc.publicnode.com}"
    PORT=8546
    ;;
  *)
    echo "Usage: $0 <mainnet|base> [extra anvil flags...]" >&2
    exit 1
    ;;
esac

RUST_LOG=debug anvil \
  --print-traces \
  --disable-code-size-limit \
  --disable-min-priority-fee \
  --no-rate-limit \
  --hardfork prague \
  --fork-url "$FORK_URL" \
  --port "$PORT" \
  "$@"
