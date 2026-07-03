#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# deploy-weth.sh — deploy a standard WETH9 to a chain that has no canonical
# wrapped-native token (e.g. Robinhood Chain). Prints the deployed address on
# the LAST line of stdout so callers can capture it.
#
# Usage:
#   ./scripts/deploy-weth.sh <RPC_URL> <PRIVATE_KEY>
#
# Requires: forge (Foundry). Run from the contracts/ directory (or anywhere —
# paths are resolved relative to this script).
# ---------------------------------------------------------------------------
set -euo pipefail

RPC_URL="${1:-}"
PRIVATE_KEY="${2:-}"

if [[ -z "$RPC_URL" || -z "$PRIVATE_KEY" ]]; then
  echo "usage: $0 <RPC_URL> <PRIVATE_KEY>" >&2
  exit 1
fi

if ! command -v forge >/dev/null 2>&1; then
  echo "error: 'forge' not found. Install Foundry: https://getfoundry.sh" >&2
  exit 1
fi

# Resolve the contracts/ root (parent of this scripts/ dir) so `forge create`
# finds foundry.toml + src/WETH9.sol regardless of the caller's cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ">> Deploying WETH9 to $RPC_URL ..." >&2

# --json makes forge emit a machine-readable object with .deployedTo.
OUTPUT="$(cd "$ROOT_DIR" && forge create \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --json \
  src/WETH9.sol:WETH9)"

# Prefer jq if present; fall back to a grep/sed parse.
if command -v jq >/dev/null 2>&1; then
  ADDR="$(echo "$OUTPUT" | jq -r '.deployedTo')"
else
  ADDR="$(echo "$OUTPUT" | grep -oE '"deployedTo":"0x[0-9a-fA-F]{40}"' | grep -oE '0x[0-9a-fA-F]{40}')"
fi

if [[ -z "${ADDR:-}" || "$ADDR" == "null" ]]; then
  echo "error: could not parse deployed WETH9 address from forge output:" >&2
  echo "$OUTPUT" >&2
  exit 1
fi

echo ">> WETH9 deployed at $ADDR" >&2
# Machine-readable: address only, on stdout.
echo "$ADDR"
