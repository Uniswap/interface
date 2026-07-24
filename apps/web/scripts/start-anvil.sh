#!/bin/bash
# Starts a local anvil fork for e2e tests and manual testing.
#
# Usage: ./start-anvil.sh <mainnet|base> [extra anvil flags...]
#
# The full argv comes from scripts/anvil-spawn-args.ts, which wraps
# buildAnvilSpawnArgs() in src/playwright/anvil/anvil-args.ts — the single source
# of truth shared with the Playwright anvil manager, so flags cannot drift
# between the two flows. All the same env knobs apply:
#
#   ANVIL_FORK_URL / ANVIL_FORK_URL_BASE   override the PublicNode fork source
#   ANVIL_FORK_BLOCK / ANVIL_FORK_BLOCK_BASE  override the pinned fork block
#   ANVIL_FORK_VIA_UNIRPC=1                fork through the uni RPC entry gateway
#                                          (session bootstrapped/reused via
#                                          ~/.uniswap/session.json; gateway override
#                                          via ANVIL_UNIRPC_GATEWAY_URL)
#   ANVIL_VERBOSE                          --print-traces + RUST_LOG=debug; this
#                                          interactive flow defaults it ON (the
#                                          Playwright manager defaults quiet)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

CHAIN=$1
shift

case "$CHAIN" in
  mainnet)
    CHAIN_ID=1
    ;;
  base)
    CHAIN_ID=8453
    ;;
  *)
    echo "Usage: $0 <mainnet|base> [extra anvil flags...]" >&2
    exit 1
    ;;
esac

# Verbose by default: this script is the interactive local flow.
export ANVIL_VERBOSE="${ANVIL_VERBOSE:-1}"

if ! ANVIL_ARGS_OUTPUT="$(bun "$SCRIPT_DIR/anvil-spawn-args.ts" "$CHAIN_ID")"; then
  echo "Failed to resolve anvil spawn args" >&2
  exit 1
fi
mapfile -t ANVIL_ARGS <<< "$ANVIL_ARGS_OUTPUT"

case "$ANVIL_VERBOSE" in
  1|true|TRUE|True)
    export RUST_LOG="${RUST_LOG:-debug}"
    ;;
esac

anvil "${ANVIL_ARGS[@]}" "$@"
