# Seed liquidity

Empty pools quote nothing — this is the real launch blocker. The seed kit creates **and** seeds
v2 pairs and v3 concentrated positions on any chain where the HookSwap stack is deployed, driven
by a JSON config.

Kit: [`contracts/seed/`](../../contracts/seed/) — see
[`contracts/seed/README.md`](../../contracts/seed/README.md). It shares the deploy kit's `.env`
and `deployments/*.json` records. **Nothing spends money until you pass `--broadcast`.**

## What it does (per pool)

- **v2:** `createPair` if missing → approve router → `addLiquidity(...)`.
- **v3:** compute `sqrtPriceX96` from your human price + decimals →
  `createAndInitializePoolIfNecessary` → approve NPM → `mint(...)` with ticks snapped to the fee
  tier's `tickSpacing`. (Real full-precision math — `TickMath` / `FullMath`; a wrong
  `sqrtPriceX96` bricks the pool.)
- **Mock tokens:** a pool side marked `MINT` deploys a fresh `MockERC20` and mints you a large
  supply (so you can seed e.g. `WETH/tUSDC` on a chain where you hold no stablecoin).
- **Auto-wrap:** if a side is the chain's WETH and your balance is short, it wraps native ETH
  (except on Tempo — no native wrapper).

## Setup

Uses the deploy kit's `../.env` (`DEPLOYER_PRIVATE_KEY`, `INFURA_KEY` for the Sepolia RPC, optional
per-chain RPC overrides). Build once:

```bash
cd contracts/seed && forge build
```

## Config

Each pool token is `{ "kind": "WETH" | "MINT" | "ADDRESS", ... }`. Pool fields include `protocol`
(`v2`/`v3`), `fee` (v3 tier), `priceAperB` (units of tokenB per 1 tokenA — drives v3
`sqrtPriceX96`), `amountA`/`amountB` (keep `amountB ≈ amountA × priceAperB`), `range`
(`wide`/`concentrated`), and `rangeTicks` (v3 concentrated half-width, default 50).

## Running it

```bash
cd contracts/seed

# DRY-RUN (default; simulates against live chain state, spends nothing)
./scripts/seed.sh sepolia
./scripts/seed.sh ink

# BROADCAST (actually create + fund — spends gas)
./scripts/seed.sh sepolia --broadcast
./scripts/seed.sh ink --broadcast
```

`<chain>` ∈ `sepolia | hyperevm | robinhood | ink | megaeth | xlayer | tempo`. Pools are read from
`config/pools.example.json` (override with `SEED_POOLS=/path/...`); addresses from
`../deployments/<chain>.json` (or `config/<chain>.json` for Sepolia). Live chainId is verified first.

## Minimum liquidity guidance

- **Technical minimum** for a v3 position is a few dollars — but a pool that small gives wild
  prices and thin quotes.
- **Usable demo:** aim for **~$200–500 of value per side** for a v3 concentrated position. A tight
  `concentrated` band makes that capital quote much deeper than a `wide` range.
- **v2** splits 50/50 by value at the deposit ratio; keep both sides ≈ equal value.
- **Sepolia is free:** fund the deployer from a faucet, mark the non-WETH side `MINT`, seed at zero
  real cost (WETH side auto-wraps from faucet ETH). The demo seeds a `WETH/tUSDC` 0.30%
  concentrated pool + a v2 `WETH/tHOOK` pool.

## Per-chain gas notes

- **Tempo** — 20 gwei floor (handled via `gasPriceGwei`). Gas is paid in pathUSD and the WETH9 is
  a routing wrapper only, so **auto-wrap won't work** — pre-fund the wrapper token or use
  `MINT`/`ADDRESS` tokens for both sides.
- **HyperEVM** — big-blocks was only needed for *deploy* txs; seeding txs are small, so standard
  blocks are fine.
- **Robinhood / XLayer** — low base fees; `chains.json` sets a small floor that clears.

## After seeding

Seeded pools are necessary but not sufficient — the interface calls a routing service, not the
pools directly. Point the self-hosted [routing](./run-routing.md) + [indexer](./run-indexer.md) at
these chains + the forked SDK addresses so quotes resolve. Until a pool has liquidity, quotes for
it 404; this kit removes that blocker.
