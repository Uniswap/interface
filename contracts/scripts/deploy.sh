#!/usr/bin/env bash
# ===========================================================================
# deploy.sh — HookSwap Uniswap v2 + v3 stack deployer (NO v4)
#
# Deploys, in canonical order, to one chain:
#   1. Permit2            (reuse canonical CREATE2 addr, or deploy from fork)
#   2. WETH / wrapped native (reuse canonical, or deploy WETH9)
#   3. Uniswap v2         (UniswapV2Factory -> UniswapV2Router02)
#   4. Uniswap v3         (via @uniswap/deploy-v3 CLI)
#   5. SwapRouter02       (from swap-router-contracts fork)
#   6. UniversalRouter    (from universal-router fork)
#
# It writes the result to deployments/<chain>.json.
#
# USAGE:
#   ./scripts/deploy.sh <chain>
#     where <chain> is a key in config/chains.json: sepolia | hyperevm | robinhood
#
# ---------------------------------------------------------------------------
# BEFORE YOU RUN — one-time setup
# ---------------------------------------------------------------------------
#   1. cp .env.example .env  &&  fill in DEPLOYER_PRIVATE_KEY + RPC URLs.
#   2. Clone the HooksOS forks into a workspace and point FORKS_DIR at it:
#
#        export FORKS_DIR="$HOME/hooksos-forks"
#        mkdir -p "$FORKS_DIR" && cd "$FORKS_DIR"
#        git clone https://github.com/HooksOS/v2-core.git
#        git clone https://github.com/HooksOS/v2-periphery.git
#        git clone https://github.com/HooksOS/v3-core.git
#        git clone https://github.com/HooksOS/v3-periphery.git
#        git clone https://github.com/HooksOS/swap-router-contracts.git
#        git clone https://github.com/HooksOS/universal-router.git
#        git clone https://github.com/HooksOS/permit2.git
#
#      Build each fork per its own README (forge build / yarn && yarn compile)
#      so the artifacts this script references exist.
#
#   3. Install Foundry (forge/cast) and Node 18+ (for npx @uniswap/deploy-v3).
#
# This script is intentionally a guided orchestrator, not one-click magic:
# every step that reaches into a fork echoes the EXACT command it runs so you
# can inspect, copy, or run it by hand. Search this file for "TODO" for the
# few values you must confirm for your fork commit.
# ===========================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# 0. Locate ourselves and the repo layout.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"          # the contracts/ directory
CONFIG_FILE="$ROOT_DIR/config/chains.json"
DEPLOYMENTS_DIR="$ROOT_DIR/deployments"

# Canonical, chain-agnostic constants.
CANONICAL_PERMIT2="0x000000000022D473030F116dDEE9F6B43aC78BA3"
DETERMINISTIC_DEPLOYER="0x4e59b44847b379578588920cA78FbF26c0B4956C"

err()  { echo "error: $*" >&2; exit 1; }
info() { echo ">> $*" >&2; }
step() { echo -e "\n=== $* ===" >&2; }

# ---------------------------------------------------------------------------
# 1. Preconditions: tools + args + env.
# ---------------------------------------------------------------------------
for tool in forge cast jq npx; do
  command -v "$tool" >/dev/null 2>&1 || err "'$tool' not found on PATH. See setup notes at top of this script."
done

CHAIN="${1:-}"
[[ -n "$CHAIN" ]] || err "usage: $0 <chain>  (one of: $(jq -r 'keys | join(", ")' "$CONFIG_FILE" 2>/dev/null || echo 'sepolia hyperevm robinhood'))"

[[ -f "$CONFIG_FILE" ]] || err "missing $CONFIG_FILE"

# Load .env if present.
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a; # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"; set +a
else
  err "no .env found at $ROOT_DIR/.env — copy .env.example and fill it in."
fi

[[ -n "${DEPLOYER_PRIVATE_KEY:-}" ]] || err "DEPLOYER_PRIVATE_KEY is not set in .env"
[[ -n "${FORKS_DIR:-}" ]] || err "FORKS_DIR is not set — export it to where you cloned the HooksOS forks (see setup notes)."

# ---------------------------------------------------------------------------
# 2. Read this chain's config.
# ---------------------------------------------------------------------------
jq -e --arg c "$CHAIN" 'has($c)' "$CONFIG_FILE" >/dev/null \
  || err "chain '$CHAIN' not found in $CONFIG_FILE"

CHAIN_ID="$(jq -r --arg c "$CHAIN" '.[$c].chainId'      "$CONFIG_FILE")"
RPC_ENV="$(jq -r --arg c "$CHAIN"  '.[$c].rpcEnvVar'    "$CONFIG_FILE")"
WETH_CFG="$(jq -r --arg c "$CHAIN" '.[$c].weth'         "$CONFIG_FILE")"
NATIVE_LABEL="$(jq -r --arg c "$CHAIN" '.[$c].nativeLabel' "$CONFIG_FILE")"

RPC_URL="${!RPC_ENV:-}"
[[ -n "$RPC_URL" ]] || err "$RPC_ENV is not set in .env (needed for chain '$CHAIN')"

# Deployer address derived from the key — used as owner/feeToSetter.
DEPLOYER_ADDR="$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"

info "chain          : $CHAIN (chainId $CHAIN_ID)"
info "rpc            : $RPC_URL"
info "deployer       : $DEPLOYER_ADDR"

# Sanity: does the RPC report the expected chainId?
LIVE_CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL" 2>/dev/null || echo '')"
if [[ -n "$LIVE_CHAIN_ID" && "$LIVE_CHAIN_ID" != "$CHAIN_ID" ]]; then
  err "RPC chainId ($LIVE_CHAIN_ID) != config chainId ($CHAIN_ID). Wrong RPC URL for '$CHAIN'?"
fi

mkdir -p "$DEPLOYMENTS_DIR"

# Fork paths (adjust names here if your clones differ — TODO: confirm).
V2_CORE_DIR="$FORKS_DIR/v2-core"
V2_PERIPHERY_DIR="$FORKS_DIR/v2-periphery"
SWAP_ROUTER_DIR="$FORKS_DIR/swap-router-contracts"
UNIVERSAL_ROUTER_DIR="$FORKS_DIR/universal-router"
PERMIT2_DIR="$FORKS_DIR/permit2"

# Convenience wrapper: forge create returning the deployed address on stdout.
# Usage: forge_create <working_dir> <ContractPath:Name> [constructor args...]
forge_create() {
  local wd="$1"; shift
  local target="$1"; shift
  local out addr
  info "forge create $target ${*:-} (in $wd)"
  out="$(cd "$wd" && forge create \
    --rpc-url "$RPC_URL" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --broadcast --json \
    "$target" ${*:+--constructor-args "$@"})"
  addr="$(echo "$out" | jq -r '.deployedTo')"
  [[ -n "$addr" && "$addr" != "null" ]] || { echo "$out" >&2; err "failed to parse deployed address for $target"; }
  echo "$addr"
}

# ===========================================================================
# STEP 1 — Permit2
# ===========================================================================
step "STEP 1: Permit2"
PERMIT2_ADDR=""
if [[ "$(cast code "$CANONICAL_PERMIT2" --rpc-url "$RPC_URL" 2>/dev/null || echo 0x)" != "0x" ]]; then
  PERMIT2_ADDR="$CANONICAL_PERMIT2"
  info "Permit2 already present at canonical $PERMIT2_ADDR — reusing."
elif [[ "$(cast code "$DETERMINISTIC_DEPLOYER" --rpc-url "$RPC_URL" 2>/dev/null || echo 0x)" != "0x" ]]; then
  # The CREATE2 deployer is present, so Permit2 CAN be deployed to its canonical
  # address deterministically. The permit2 repo ships a forge script for this.
  info "Deterministic deployer present but Permit2 not deployed yet."
  info "Deploying Permit2 from the fork to its canonical CREATE2 address..."
  [[ -d "$PERMIT2_DIR" ]] || err "permit2 fork not found at $PERMIT2_DIR"
  # The permit2 repo builds a single Permit2 contract; deploying via the
  # deterministic deployer reproduces 0x000000000022D473...ac78BA3.
  # TODO: confirm the exact script path in your permit2 fork. Upstream ships
  #   script/DeployPermit2.s.sol (contract DeployPermit2). If your fork differs,
  #   update the --sig/target below.
  ( cd "$PERMIT2_DIR" && forge script script/DeployPermit2.s.sol:DeployPermit2 \
      --rpc-url "$RPC_URL" --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast ) \
    || err "Permit2 deploy script failed — deploy it manually and re-run, or hard-code the address."
  PERMIT2_ADDR="$CANONICAL_PERMIT2"
else
  err "No canonical Permit2 and no deterministic deployer on this chain.
     Deploy Permit2 manually from $PERMIT2_DIR (forge create src/Permit2.sol:Permit2),
     note the address, then set PERMIT2_ADDR and comment out this branch."
fi
info "permit2 = $PERMIT2_ADDR"

# ===========================================================================
# STEP 2 — WETH / wrapped native
# ===========================================================================
step "STEP 2: WETH / wrapped native"
if [[ "$WETH_CFG" == "DEPLOY" ]]; then
  info "No canonical wrapped-native for $CHAIN — deploying a fresh WETH9."
  WETH_ADDR="$("$SCRIPT_DIR/deploy-weth.sh" "$RPC_URL" "$DEPLOYER_PRIVATE_KEY")"
else
  WETH_ADDR="$WETH_CFG"
  # Verify it actually has code — a wrong/empty WETH breaks everything downstream.
  [[ "$(cast code "$WETH_ADDR" --rpc-url "$RPC_URL" 2>/dev/null || echo 0x)" != "0x" ]] \
    || err "configured WETH $WETH_ADDR has no code on chain $CHAIN_ID"
  info "Reusing canonical wrapped-native at $WETH_ADDR"
fi
info "weth = $WETH_ADDR"

# ===========================================================================
# STEP 3 — Uniswap v2 (factory + router) + pair init code hash
# ===========================================================================
step "STEP 3: Uniswap v2"
[[ -d "$V2_CORE_DIR" ]]      || err "v2-core fork not found at $V2_CORE_DIR"
[[ -d "$V2_PERIPHERY_DIR" ]] || err "v2-periphery fork not found at $V2_PERIPHERY_DIR"

# UniswapV2Factory(address _feeToSetter)
# TODO: confirm the source path/name in your fork. Upstream: contracts/UniswapV2Factory.sol.
V2_FACTORY="$(forge_create "$V2_CORE_DIR" "contracts/UniswapV2Factory.sol:UniswapV2Factory" "$DEPLOYER_ADDR")"
info "v2Factory = $V2_FACTORY"

# Pair init code hash = keccak256(type(UniswapV2Pair).creationCode).
# This MUST be recorded — the v2-sdk fork and UniswapV2Library both hard-code it,
# and a recompiled fork almost always has a DIFFERENT hash than mainnet's
# 0x96e8ac42...845f. We read the creation bytecode straight from the artifact.
V2_PAIR_INITCODE="$(cd "$V2_CORE_DIR" && forge inspect contracts/UniswapV2Pair.sol:UniswapV2Pair bytecode)"
V2_PAIR_INITCODE_HASH="$(cast keccak "$V2_PAIR_INITCODE")"
info "v2PairInitCodeHash = $V2_PAIR_INITCODE_HASH"
info "   ^ feed this into the v2-sdk / v2-periphery UniswapV2Library for chainId $CHAIN_ID"

# UniswapV2Router02(address _factory, address _WETH)
# TODO: confirm path in your fork. Upstream: contracts/UniswapV2Router02.sol.
V2_ROUTER="$(forge_create "$V2_PERIPHERY_DIR" "contracts/UniswapV2Router02.sol:UniswapV2Router02" "$V2_FACTORY" "$WETH_ADDR")"
info "v2Router = $V2_ROUTER"

# ===========================================================================
# STEP 4 — Uniswap v3 (via @uniswap/deploy-v3 CLI)
# ===========================================================================
step "STEP 4: Uniswap v3 (@uniswap/deploy-v3)"
# The CLI persists progress + results to a state JSON (-s). We parse it after.
V3_STATE="$DEPLOYMENTS_DIR/v3-state-$CHAIN.json"
info "Running @uniswap/deploy-v3 (state file: $V3_STATE)"
info "note: the v3 pool init code hash is FIXED unless v3-core was recompiled;"
info "      if you recompiled v3-core, update poolInitCodeHash in the SDK/router accordingly."

# -pk key  -j rpc  -w9 weth9  -ncl native-label  -o owner  -v2 v2Factory  -s state
# -v2 lets the CLI wire up the V3Migrator against our freshly-deployed v2 factory.
npx --yes @uniswap/deploy-v3 \
  -pk "$DEPLOYER_PRIVATE_KEY" \
  -j "$RPC_URL" \
  -w9 "$WETH_ADDR" \
  -ncl "$NATIVE_LABEL" \
  -o "$DEPLOYER_ADDR" \
  -v2 "$V2_FACTORY" \
  -s "$V3_STATE" \
  || err "@uniswap/deploy-v3 failed. Re-run: it resumes from the state file $V3_STATE"

# Parse the state file the CLI writes.
V3_FACTORY="$(jq -r '.v3CoreFactoryAddress // empty'                "$V3_STATE")"
V3_POSITION_MANAGER="$(jq -r '.nonfungibleTokenPositionManagerAddress // empty' "$V3_STATE")"
V3_QUOTER_V2="$(jq -r '.quoterV2Address // empty'                   "$V3_STATE")"
V3_MIGRATOR="$(jq -r '.v3MigratorAddress // empty'                 "$V3_STATE")"

[[ -n "$V3_FACTORY" ]]          || err "could not read v3CoreFactoryAddress from $V3_STATE"
[[ -n "$V3_POSITION_MANAGER" ]] || err "could not read position manager from $V3_STATE"
info "v3Factory         = $V3_FACTORY"
info "v3PositionManager = $V3_POSITION_MANAGER"
info "v3QuoterV2        = ${V3_QUOTER_V2:-<none>}"
info "v3Migrator        = ${V3_MIGRATOR:-<none>}"

# ===========================================================================
# STEP 5 — SwapRouter02 (from swap-router-contracts)
# ===========================================================================
step "STEP 5: SwapRouter02"
[[ -d "$SWAP_ROUTER_DIR" ]] || err "swap-router-contracts fork not found at $SWAP_ROUTER_DIR"
# SwapRouter02 constructor:
#   constructor(address _factoryV2, address factoryV3, address _positionManager, address _WETH9)
# TODO: confirm source path in your fork. Upstream: contracts/SwapRouter02.sol.
SWAP_ROUTER_02="$(forge_create "$SWAP_ROUTER_DIR" "contracts/SwapRouter02.sol:SwapRouter02" \
  "$V2_FACTORY" "$V3_FACTORY" "$V3_POSITION_MANAGER" "$WETH_ADDR")"
info "swapRouter02 = $SWAP_ROUTER_02"

# ===========================================================================
# STEP 6 — UniversalRouter (from universal-router)
# ===========================================================================
step "STEP 6: UniversalRouter"
[[ -d "$UNIVERSAL_ROUTER_DIR" ]] || err "universal-router fork not found at $UNIVERSAL_ROUTER_DIR"
#
# UniversalRouter takes a single RouterParameters struct. In the v4-era code
# (what you should be on since the struct mentions v4 fields) the struct is:
#
#   struct RouterParameters {
#       address permit2;              // <- our Permit2
#       address weth9;                // <- our WETH
#       address v2Factory;            // <- our UniswapV2Factory
#       address v3Factory;            // <- our v3 core factory
#       bytes32 pairInitCodeHash;     // <- our v2PairInitCodeHash
#       bytes32 poolInitCodeHash;     // <- v3 pool init code hash (see below)
#       address v4PoolManager;        // <- address(0)  (we ship NO v4)
#       address v3NFTPositionManager; // <- v3 position manager (or address(0) if unused)
#       address v4PositionManager;    // <- address(0)  (we ship NO v4)
#   }
#
# The v3 POOL init code hash: for an UNMODIFIED v3-core the canonical value is
#   0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54
# If your v3-core fork was recompiled with different settings, recompute it
# from the fork and use that instead.
V3_POOL_INITCODE_HASH="0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54"

# Because passing a Solidity struct through `forge create --constructor-args`
# is fiddly (and the exact struct layout depends on your fork's commit), we do
# NOT auto-broadcast this one. Instead we print the exact deploy you should run.
# A ready-to-run forge script is the most robust path — see README "UniversalRouter".
#
# TODO (CONFIRM): verify the RouterParameters field order/count matches YOUR
# universal-router fork commit before deploying. Older (pre-v4) commits have a
# LARGER struct with marketplace fields (seaport, x2y2, looksRare, ...) — if you
# are on such a commit, set every non-Uniswap field to address(0) and keep the
# permit2/weth9/v2Factory/v3Factory/pairInitCodeHash/poolInitCodeHash values.
UNIVERSAL_ROUTER="TODO_DEPLOY_MANUALLY"
cat >&2 <<EOF

  ---------------------------------------------------------------------------
  ACTION REQUIRED: deploy UniversalRouter with these RouterParameters:

    permit2              = $PERMIT2_ADDR
    weth9                = $WETH_ADDR
    v2Factory            = $V2_FACTORY
    v3Factory            = $V3_FACTORY
    pairInitCodeHash     = $V2_PAIR_INITCODE_HASH
    poolInitCodeHash     = $V3_POOL_INITCODE_HASH
    v4PoolManager        = 0x0000000000000000000000000000000000000000
    v3NFTPositionManager = $V3_POSITION_MANAGER
    v4PositionManager    = 0x0000000000000000000000000000000000000000

  Recommended: create script/DeployUniversalRouter.s.sol in your universal-router
  fork that constructs this struct and deploys, then run:

    cd "$UNIVERSAL_ROUTER_DIR" && forge script script/DeployUniversalRouter.s.sol \\
      --rpc-url "$RPC_URL" --private-key "\$DEPLOYER_PRIVATE_KEY" --broadcast

  Then set universalRouter in $DEPLOYMENTS_DIR/$CHAIN.json (or edit UNIVERSAL_ROUTER
  above and re-run just this step).
  ---------------------------------------------------------------------------

EOF

# ===========================================================================
# WRITE deployments/<chain>.json
# ===========================================================================
step "Writing deployment record"
OUT_FILE="$DEPLOYMENTS_DIR/$CHAIN.json"
jq -n \
  --argjson chainId "$CHAIN_ID" \
  --arg permit2 "$PERMIT2_ADDR" \
  --arg weth "$WETH_ADDR" \
  --arg v2Factory "$V2_FACTORY" \
  --arg v2Router "$V2_ROUTER" \
  --arg v2PairInitCodeHash "$V2_PAIR_INITCODE_HASH" \
  --arg v3Factory "$V3_FACTORY" \
  --arg v3PositionManager "$V3_POSITION_MANAGER" \
  --arg v3QuoterV2 "$V3_QUOTER_V2" \
  --arg v3Migrator "$V3_MIGRATOR" \
  --arg swapRouter02 "$SWAP_ROUTER_02" \
  --arg universalRouter "$UNIVERSAL_ROUTER" \
  '{
     chainId: $chainId,
     permit2: $permit2,
     weth: $weth,
     v2Factory: $v2Factory,
     v2Router: $v2Router,
     v2PairInitCodeHash: $v2PairInitCodeHash,
     v3Factory: $v3Factory,
     v3PositionManager: $v3PositionManager,
     v3QuoterV2: $v3QuoterV2,
     v3Migrator: $v3Migrator,
     swapRouter02: $swapRouter02,
     universalRouter: $universalRouter
   }' > "$OUT_FILE"

info "wrote $OUT_FILE"
echo >&2
info "DONE for $CHAIN. Remaining manual item(s): UniversalRouter (see above) if not yet deployed."
cat "$OUT_FILE"
