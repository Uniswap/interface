# HookSwap Pool-Seeding Kit

Create **and seed** liquidity pools — Uniswap **v2 pairs** and **v3 concentrated
positions** — on any chain where the HookSwap stack is already deployed, with one
command, driven by a JSON config.

> Empty pools quote nothing. This kit is what turns "stack deployed" into "the
> Trading API returns real quotes instead of 404s." No liquidity = no routes.

This is a sibling of the deploy kit at [`../`](../README.md) and shares its
`.env`, its `deployments/*.json` records, and its guided, run-it-yourself style.
Nothing here spends money until you pass `--broadcast`.

---

## What it does

For each pool in your config, `scripts/seed.sh`:

- **v2:** creates the pair (`createPair`) if missing, approves the v2 router,
  then `addLiquidity(tokenA, tokenB, amountA, amountB, 0, 0, you, deadline)`.
- **v3:** computes the correct `sqrtPriceX96` from your human price + token
  decimals, `createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96)`,
  approves the NonfungiblePositionManager, then `mint(...)` a position with ticks
  snapped to the fee tier's `tickSpacing`.
- **Mock tokens:** any pool side marked `MINT` deploys a fresh `MockERC20` and
  mints a big supply to your deployer first — so you can seed e.g. `WETH/tUSDC`
  on a chain where you hold no stablecoin.
- **Auto-wrap:** if a pool side is the chain's `WETH` and your WETH balance is
  short, it wraps the shortfall from native ETH (except on Tempo — see below).

The v3 math is real, not faked: see `src/libraries/TickMath.sol` (Uniswap v3-core,
0.8 port) and `_sqrtPriceX96` / `_ticks` in `script/SeedPools.s.sol`. A wrong
`sqrtPriceX96` bricks the pool, so it's computed with full-precision `FullMath`.

---

## Files

```
contracts/seed/
├── README.md
├── foundry.toml                 # solc 0.8.24, optimizer, via_ir, fs read perms
├── src/
│   ├── MockERC20.sol            # self-contained mintable test ERC20
│   ├── interfaces/              # IERC20/IWETH, v2 factory+router, v3 factory, NPM
│   ├── libraries/
│   │   ├── FullMath.sol         # 512-bit mulDiv + Babylonian sqrt
│   │   └── TickMath.sol         # sqrtRatio <-> tick (Uniswap v3-core, 0.8)
│   └── vendor/Script.sol        # minimal forge scripting shim (no forge-std dep)
├── script/
│   └── SeedPools.s.sol          # the seeder (one pool per invocation)
├── config/
│   ├── chains.json              # per-chain RPC + gas metadata
│   ├── sepolia.json             # canonical Sepolia addresses (deployment-record shaped)
│   └── pools.example.json       # documented example pools (Sepolia + Ink)
└── scripts/
    └── seed.sh                  # orchestrator: seed.sh <chain> [--broadcast]
```

The kit is **self-contained** — it vendors the handful of interfaces, math
libraries, and a minimal `Vm`/`Script`/`console2` shim it needs, so there is no
`lib/`/submodule to check out and `forge build` works standalone.

---

## Setup (one time)

Uses the deploy kit's `.env` (`../.env`):

```bash
# ../.env
DEPLOYER_PRIVATE_KEY=<bare 64-hex or 0x-prefixed>   # same deployer that owns the stack
INFURA_KEY=<key>                                    # only needed for the Sepolia default RPC
# optional per-chain RPC overrides:
# INK_RPC_URL=...   MEGAETH_RPC_URL=...   TEMPO_RPC_URL=...   (etc.)
```

Requirements: `forge` + `cast` (Foundry) and `jq`. Build once:

```bash
cd contracts/seed && forge build
```

---

## How amounts + price map to the config

Each pool token is `{ "kind": "WETH" | "MINT" | "ADDRESS", ... }`:

- **WETH** — the chain's wrapped-native (from the deployment record's `weth9`).
- **MINT** — deploy a `MockERC20` (give `name`/`symbol`/`decimals`) and mint a big
  supply to you. Use when you hold no real token on that chain.
- **ADDRESS** — an existing token you already hold (`address` + `decimals`).

Pool fields:

| field        | meaning |
| ------------ | ------- |
| `protocol`   | `"v2"` or `"v3"` |
| `fee`        | v3 only: `100` / `500` / `3000` / `10000` → tickSpacing `1` / `10` / `60` / `200` |
| `priceAperB` | human price: **units of tokenB per 1 unit of tokenA**. e.g. `tokenA=WETH, tokenB=tUSDC, priceAperB=2500` ⇒ 1 WETH = 2500 tUSDC. Drives the v3 initial `sqrtPriceX96`. |
| `amountA`    | human amount of tokenA to deposit |
| `amountB`    | human amount of tokenB to deposit (keep `amountB ≈ amountA × priceAperB` so v3 uses both sides) |
| `range`      | v3 only: `"wide"` (full usable range) or `"concentrated"` (±`rangeTicks` tickSpacings around the current tick) |
| `rangeTicks` | v3 concentrated only, optional (default 50): half-width in tickSpacings |

Notes:
- **v3** uses `priceAperB` to set the pool price; token0/token1 sorting and the
  price orientation (inverting when tokenB sorts to token0) are handled in the
  contract, after any `MINT` deploy.
- **v2** has no `sqrtPrice` — the deposit **ratio** sets the price, so keep
  `amountA : amountB` in the intended proportion (`≈ priceAperB`).

Human values are scaled to `*1e18` integers by `cast to-wei` in `seed.sh` (exact
big-decimal, no float loss), then converted to each token's base units inside the
contract.

---

## Minimum liquidity guidance

- **Technical minimum** for a v3 position is a few dollars of value — but a pool
  that small gives wild prices and thin quotes.
- **Usable demo:** aim for **~$200–500 of value per side** for a v3 concentrated
  position (the example pools are sized around this). A tight `concentrated` band
  makes that capital quote much deeper than a `wide` range would.
- **v2** splits 50/50 by value at the deposit ratio; keep both sides ≈ equal value.
- **Sepolia is free:** fund the deployer from a faucet, mark the non-WETH side
  `MINT`, and seed at zero real cost. The WETH side is auto-wrapped from your
  faucet ETH.

---

## Running it

**Always dry-run first** (the default). Dry-run simulates every call against the
live chain state and spends nothing:

```bash
cd contracts/seed

# DRY-RUN (simulate; no broadcast)
./scripts/seed.sh sepolia
./scripts/seed.sh ink

# BROADCAST (actually create + fund the pools — spends gas)
./scripts/seed.sh sepolia --broadcast
./scripts/seed.sh ink --broadcast
```

`<chain>` is a key in `config/chains.json`:
`sepolia | hyperevm | robinhood | ink | megaeth | xlayer | tempo`.

It reads the pools for that chain's `chainId` from `config/pools.example.json`
(override with `SEED_POOLS=/path/to/pools.json`), and the addresses to call from
`../deployments/<chain>.json` (or `config/<chain>.json` for Sepolia). It verifies
the live RPC `chainId` matches before doing anything.

### Seed the free Sepolia demo pool

```bash
# 1. Put a Sepolia key + a funded deployer in ../.env (INFURA_KEY, DEPLOYER_PRIVATE_KEY).
#    Get free Sepolia ETH from any faucet.
# 2. Preview:
./scripts/seed.sh sepolia
# 3. Broadcast the WETH/tUSDC 0.30% concentrated pool (+ the v2 WETH/tHOOK demo):
./scripts/seed.sh sepolia --broadcast
```

This mints `tUSDC`/`tHOOK` test tokens to you, wraps a little faucet ETH into
WETH, creates the pools, and adds the positions — all free.

### Per-chain gas notes

- **Tempo** — 20 gwei network **floor** (lower is rejected); handled via
  `gasPriceGwei` in `chains.json`. Gas is paid in pathUSD and the `weth9` there is
  a *routing wrapper only*, so **auto-wrap won't work** — pre-fund the deployer
  with that wrapper token, or use `MINT`/`ADDRESS` tokens for both sides.
- **HyperEVM** — big-blocks mode was needed for the *deploy* txs; seeding txs are
  small (well under the 3M small-block limit) so standard blocks are fine.
- **Robinhood / XLayer** — low base fees; `chains.json` sets a small `gasPriceGwei`
  floor that clears.

---

## After seeding

Seeded pools are necessary but not sufficient for the interface to quote: the
frontend calls a routing service, not the pools directly. With liquidity in place,
point your self-hosted `routing-api` / `smart-order-router` (and the Trading API
adapter) at these chains + the forked SDK addresses so quotes resolve. Until a
pool has liquidity, quotes for it 404 — this kit removes that blocker.
