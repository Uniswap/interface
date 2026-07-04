#!/usr/bin/env bash
# ===========================================================================
# seed.sh — HookSwap pool-seeding orchestrator
#
# Creates + seeds liquidity pools (Uniswap v2 pairs and v3 concentrated
# positions) on a chain where the HookSwap stack is already deployed. Reads:
#   - config/chains.json      : per-chain RPC + gas metadata
#   - the deployment record   : ../deployments/<chain>.json (or config/<chain>.json
#                               for sepolia, which uses canonical addresses)
#   - config/pools.example.json (or $SEED_POOLS) : the pools to create, per chainId
#
# For each pool it exports env vars and runs script/SeedPools.s.sol once.
#
# USAGE:
#   ./scripts/seed.sh <chain>                 # DRY-RUN (simulate, spends nothing)
#   ./scripts/seed.sh <chain> --broadcast     # actually send txs (spends gas!)
#
#   <chain> is a key in config/chains.json: sepolia | hyperevm | robinhood | ink |
#           megaeth | xlayer | tempo
#
# ALWAYS dry-run first (default) and read the simulated output before broadcasting.
#
# ENV (from ../.env):
#   DEPLOYER_PRIVATE_KEY  (required)  bare 64-hex or 0x-prefixed; forge accepts both
#   INFURA_KEY            (sepolia)   used to build the default Sepolia RPC
#   <CHAIN>_RPC_URL       (optional)  overrides the chains.json rpc for that chain
#   SEED_POOLS            (optional)  path to a pools JSON (default config/pools.example.json)
# ===========================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"                 # contracts/seed
CONTRACTS_DIR="$(cd "$ROOT_DIR/.." && pwd)"              # contracts
CHAINS_FILE="$ROOT_DIR/config/chains.json"

err()  { echo "error: $*" >&2; exit 1; }
info() { echo ">> $*" >&2; }
step() { echo -e "\n=== $* ===" >&2; }

# ---------------------------------------------------------------------------
# 1. Preconditions
# ---------------------------------------------------------------------------
for tool in forge cast jq; do
  command -v "$tool" >/dev/null 2>&1 || err "'$tool' not found on PATH."
done

CHAIN="${1:-}"
[[ -n "$CHAIN" ]] || err "usage: $0 <chain> [--broadcast]  (chains: $(jq -r 'keys|map(select(startswith("_")|not))|join(", ")' "$CHAINS_FILE" 2>/dev/null))"

BROADCAST=0
if [[ "${2:-}" == "--broadcast" ]]; then BROADCAST=1; fi

[[ -f "$CHAINS_FILE" ]] || err "missing $CHAINS_FILE"
jq -e --arg c "$CHAIN" 'has($c)' "$CHAINS_FILE" >/dev/null || err "chain '$CHAIN' not in $CHAINS_FILE"

# Load .env from the deploy kit (shared).
if [[ -f "$CONTRACTS_DIR/.env" ]]; then
  set -a; # shellcheck disable=SC1091
  source "$CONTRACTS_DIR/.env"; set +a
else
  err "no .env at $CONTRACTS_DIR/.env — copy .env.example and fill DEPLOYER_PRIVATE_KEY (+ INFURA_KEY for sepolia)."
fi
[[ -n "${DEPLOYER_PRIVATE_KEY:-}" ]] || err "DEPLOYER_PRIVATE_KEY not set in .env"

# ---------------------------------------------------------------------------
# 2. Resolve chain metadata + RPC
# ---------------------------------------------------------------------------
CHAIN_ID="$(jq -r --arg c "$CHAIN" '.[$c].chainId'      "$CHAINS_FILE")"
RPC_TPL="$(jq -r  --arg c "$CHAIN" '.[$c].rpc'          "$CHAINS_FILE")"
RPC_ENV="$(jq -r  --arg c "$CHAIN" '.[$c].rpcEnvVar'    "$CHAINS_FILE")"
GAS_GWEI="$(jq -r --arg c "$CHAIN" '.[$c].gasPriceGwei // "null"' "$CHAINS_FILE")"
CHAIN_NOTE="$(jq -r --arg c "$CHAIN" '.[$c].note // ""'  "$CHAINS_FILE")"

# RPC precedence: explicit <CHAIN>_RPC_URL override > chains.json rpc template.
RPC_URL="${!RPC_ENV:-}"
if [[ -z "$RPC_URL" ]]; then
  RPC_URL="$RPC_TPL"
  # substitute ${INFURA_KEY} / ${TEMPO_RPC_URL} style placeholders from env
  RPC_URL="$(eval "echo \"$RPC_URL\"")"
fi
[[ -n "$RPC_URL" && "$RPC_URL" != *'${'* ]] \
  || err "could not resolve RPC for '$CHAIN'. Set $RPC_ENV (or INFURA_KEY for sepolia) in .env."

# ---------------------------------------------------------------------------
# 3. Resolve the deployment record (addresses the seeder will call)
# ---------------------------------------------------------------------------
DEPLOYMENT_JSON=""
for cand in "$CONTRACTS_DIR/deployments/$CHAIN.json" "$ROOT_DIR/config/$CHAIN.json"; do
  if [[ -f "$cand" ]]; then DEPLOYMENT_JSON="$cand"; break; fi
done
[[ -n "$DEPLOYMENT_JSON" ]] || err "no deployment record for '$CHAIN' (looked in ../deployments/ and config/). Deploy the stack first."

for key in weth9 v2Factory v2Router02 v3Factory nonfungiblePositionManager; do
  v="$(jq -r --arg k "$key" '.[$k] // empty' "$DEPLOYMENT_JSON")"
  [[ -n "$v" ]] || err "deployment record $DEPLOYMENT_JSON is missing '$key' — the seeder needs it."
done

# ---------------------------------------------------------------------------
# 4. Pools file + deployer
# ---------------------------------------------------------------------------
POOLS_FILE="${SEED_POOLS:-$ROOT_DIR/config/pools.example.json}"
[[ -f "$POOLS_FILE" ]] || err "pools file not found: $POOLS_FILE"
jq -e --arg id "$CHAIN_ID" 'has($id)' "$POOLS_FILE" >/dev/null \
  || err "no pools defined for chainId $CHAIN_ID in $POOLS_FILE"
N_POOLS="$(jq -r --arg id "$CHAIN_ID" '.[$id] | length' "$POOLS_FILE")"

DEPLOYER_ADDR="$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"

# Optional gas-price flag (some chains have a network floor).
GAS_FLAG=()
if [[ "$GAS_GWEI" != "null" && -n "$GAS_GWEI" ]]; then
  GAS_WEI="$(cast to-wei "$GAS_GWEI" gwei)"
  GAS_FLAG=(--with-gas-price "$GAS_WEI")
fi

step "HookSwap pool seeder"
info "chain        : $CHAIN (chainId $CHAIN_ID)"
info "rpc          : $RPC_URL"
info "deployer     : $DEPLOYER_ADDR"
info "deployment   : $DEPLOYMENT_JSON"
info "pools file   : $POOLS_FILE  ($N_POOLS pool(s) for this chain)"
info "gas price    : ${GAS_GWEI} gwei"
[[ -n "$CHAIN_NOTE" ]] && info "note         : $CHAIN_NOTE"
if [[ "$BROADCAST" -eq 1 ]]; then
  info "MODE         : *** BROADCAST — this WILL send transactions and spend gas ***"
else
  info "MODE         : DRY-RUN (simulate only; nothing is broadcast). Re-run with --broadcast to send."
fi

# Sanity: does the live RPC report the expected chainId?
LIVE_CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL" 2>/dev/null || echo '')"
if [[ -n "$LIVE_CHAIN_ID" && "$LIVE_CHAIN_ID" != "$CHAIN_ID" ]]; then
  err "RPC chainId ($LIVE_CHAIN_ID) != config chainId ($CHAIN_ID). Wrong RPC for '$CHAIN'?"
fi

# ---------------------------------------------------------------------------
# 5. Loop pools -> run the forge script once per pool
# ---------------------------------------------------------------------------
tok() { # tok <poolIndex> <A|B> <field>  -> value from pools JSON, empty if absent
  jq -r --arg id "$CHAIN_ID" --argjson i "$1" --arg ab "token$2" --arg f "$3" \
    '.[$id][$i][$ab][$f] // empty' "$POOLS_FILE"
}
fld() { # fld <poolIndex> <field>
  jq -r --arg id "$CHAIN_ID" --argjson i "$1" --arg f "$2" \
    '.[$id][$i][$f] // empty' "$POOLS_FILE"
}

for ((i=0; i<N_POOLS; i++)); do
  PROTOCOL="$(fld "$i" protocol)"
  LABEL="$(fld "$i" label)"
  step "Pool #$((i+1))/$N_POOLS — [$PROTOCOL] ${LABEL:-<no label>}"

  # ---- token A ----
  A_KIND="$(tok "$i" A kind)"
  A_DEC="$(tok "$i" A decimals)"
  case "$A_KIND" in
    WETH)    SEED_TOKENA="WETH" ;;
    MINT)    SEED_TOKENA="MINT" ;;
    ADDRESS) SEED_TOKENA="$(tok "$i" A address)" ;;
    *)       err "pool #$i tokenA.kind must be WETH|MINT|ADDRESS (got '$A_KIND')" ;;
  esac
  # ---- token B ----
  B_KIND="$(tok "$i" B kind)"
  B_DEC="$(tok "$i" B decimals)"
  case "$B_KIND" in
    WETH)    SEED_TOKENB="WETH" ;;
    MINT)    SEED_TOKENB="MINT" ;;
    ADDRESS) SEED_TOKENB="$(tok "$i" B address)" ;;
    *)       err "pool #$i tokenB.kind must be WETH|MINT|ADDRESS (got '$B_KIND')" ;;
  esac

  PRICE="$(fld "$i" priceAperB)";   [[ -n "$PRICE"   ]] || err "pool #$i missing priceAperB"
  AMT_A="$(fld "$i" amountA)";      [[ -n "$AMT_A"   ]] || err "pool #$i missing amountA"
  AMT_B="$(fld "$i" amountB)";      [[ -n "$AMT_B"   ]] || err "pool #$i missing amountB"
  FEE="$(fld "$i" fee)";            FEE="${FEE:-3000}"
  RANGE="$(fld "$i" range)";        RANGE="${RANGE:-concentrated}"
  RANGE_TICKS="$(fld "$i" rangeTicks)"; RANGE_TICKS="${RANGE_TICKS:-50}"

  # Scale human -> *1e18 integers using cast (exact big-decimal, no float loss).
  PRICE_E18="$(cast to-wei "$PRICE" ether)"
  AMTA_E18="$(cast to-wei "$AMT_A" ether)"
  AMTB_E18="$(cast to-wei "$AMT_B" ether)"

  # Export the per-pool contract the solidity script reads.
  export DEPLOYMENT_JSON SEED_RECIPIENT="$DEPLOYER_ADDR"
  export SEED_PROTOCOL="$PROTOCOL"
  export SEED_TOKENA SEED_TOKENB
  export SEED_TOKENA_SYMBOL="$(tok "$i" A symbol)" SEED_TOKENB_SYMBOL="$(tok "$i" B symbol)"
  export SEED_TOKENA_NAME="$(tok "$i" A name)"     SEED_TOKENB_NAME="$(tok "$i" B name)"
  export SEED_TOKENA_DECIMALS="$A_DEC"             SEED_TOKENB_DECIMALS="$B_DEC"
  export SEED_AMOUNTA_E18="$AMTA_E18"              SEED_AMOUNTB_E18="$AMTB_E18"
  export SEED_PRICE_E18="$PRICE_E18"
  export SEED_FEE="$FEE" SEED_RANGE="$RANGE" SEED_RANGE_TICKS="$RANGE_TICKS"

  FORGE_ARGS=(script script/SeedPools.s.sol:SeedPools
    --rpc-url "$RPC_URL"
    --private-key "$DEPLOYER_PRIVATE_KEY"
    "${GAS_FLAG[@]}")
  if [[ "$BROADCAST" -eq 1 ]]; then
    FORGE_ARGS+=(--broadcast)
  fi

  info "running: forge script SeedPools (pool #$((i+1)))"
  ( cd "$ROOT_DIR" && forge "${FORGE_ARGS[@]}" ) \
    || err "seed of pool #$((i+1)) failed (see forge output above). Nothing after this pool ran."
done

step "Seeding complete for $CHAIN"
if [[ "$BROADCAST" -eq 0 ]]; then
  info "That was a DRY-RUN. Re-run with --broadcast to actually create + fund the pools:"
  info "    ./scripts/seed.sh $CHAIN --broadcast"
fi
