# Launchpad integration

How a third-party launchpad (e.g. a pump.fun-style bonding-curve launcher) creates and seeds
liquidity pools on HookSwap so that graduated tokens become swappable and routable.

This page summarizes the integration package. The full guide, ABIs, and runnable examples are
in [`launchpad-integration/`](../../launchpad-integration/) — see especially
[`launchpad-integration/README.md`](../../launchpad-integration/README.md) and the
machine-readable [`addresses.json`](../../launchpad-integration/addresses.json).

## What you're integrating with

- HookSwap's **own** v2 + v3 + Universal Router deployments (canonical Uniswap bytecode).
- **No v4 / no hooks** — pool creation is the classic v2 `createPair` / v3
  `NonfungiblePositionManager` path. There is no PoolManager. Do not attempt v4 flows.
- Addresses per chain: see [contract-addresses.md](./contract-addresses.md). Init-code hashes
  and Permit2 are canonical and identical everywhere.

## Why integrate

On **graduation**, a bonding-curve launch deposits its accumulated reserves (token + quote
asset) into a real AMM pool so the token trades freely. Integrating with HookSwap means:

1. Call HookSwap's **v2 factory + router** (simplest) or **v3 NonfungiblePositionManager**
   (capital-efficient) to create and seed the pool.
2. Once the pool holds liquidity, HookSwap routing/interface can quote and route against it.
3. **Pair against the chain's WETH / wrapped-native** so routing discovers it automatically.

## v2 flow (recommended for most graduations)

Single-tier constant-product pool; the deposit ratio sets the opening price. No tick math.

1. **Create the pair** (idempotent): `IUniswapV2Factory(v2Factory).createPair(token, WETH)`.
   `addLiquidityETH` also auto-creates it, so this step is optional. Check existence with
   `getPair(token, WETH)` (zero address = not created).
2. **Approve** the router: `IERC20(token).approve(v2Router02, amountTokenDesired)`.
3. **Add liquidity**:
   `UniswapV2Router02.addLiquidityETH{value: ethAmount}(token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline)`.
   For token/token (or on Tempo) use `addLiquidity(tokenA, tokenB, ...)` with both sides approved.

The opening price is the ratio `amountTokenDesired : ethAmount`. Runnable version:
[`examples/createV2Pair.ts`](../../launchpad-integration/examples/createV2Pair.ts).

## v3 flow (concentrated liquidity)

Pools are per **(token0, token1, fee)**; price is `sqrtPriceX96`, liquidity between two ticks.

1. **Sort tokens** — `token0 < token1` by byte value (unsorted → inverted price).
2. **Compute `sqrtPriceX96`** from your launch price `P` (token1 per token0, decimals-adjusted):
   `sqrtPriceX96 = floor(sqrt(P) * 2**96)`.
3. **Create + initialize** (idempotent):
   `NonfungiblePositionManager.createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96)`.
4. **Approve** the NPM for both sides.
5. **Mint** with `mint(MintParams)` — `tickLower`/`tickUpper` **must** be multiples of the fee
   tier's `tickSpacing`, and the current tick must sit inside the range (else single-sided).

Full-range endpoints: `MIN_TICK = -887272`, `MAX_TICK = 887272` snapped to spacing (e.g. spacing
60 → `[-887220, 887220]`). Runnable version with `priceToSqrtPriceX96` / `priceToTick` /
`nearestUsableTick` helpers: [`examples/createV3Pool.ts`](../../launchpad-integration/examples/createV3Pool.ts).

## Recommended graduation pattern

- **Pair against the chain's WETH / wrapped-native.** Routing treats WETH as a connector token,
  so `token → WETH` pools are **auto-discovered** — a brand-new token/WETH pool is immediately
  routable.
- **Arbitrary token/token pairs** (e.g. token/USDC) are valid but **not** auto-discovered unless
  the pair is indexed by HookSwap's subgraph. If you must pair against a non-WETH quote, ensure
  it's picked up by the subgraph or the token won't route through multi-hop paths.
- **On Tempo:** no native wrapper — pair against `pathUSD` / another ERC-20 and use
  `addLiquidity` (never `addLiquidityETH`).
- Prefer **v2** for a simple fixed-ratio graduation; use **v3** only if you want concentration
  and can compute ticks correctly.

## Verifying a pool is live & quotable

- **v2:** `getPair(token, WETH)` non-zero, and `getReserves()` returns non-zero reserves.
- **v3:** `getPool(token0, token1, fee)` non-zero, then static-call **QuoterV2**
  (`quoteExactInputSingle.staticCall(...)` — it reverts internally to return data, so use
  `callStatic` / `.staticCall`). Non-zero `amountOut` on a small `amountIn` confirms liquidity.

## Package contents

- [`addresses.json`](../../launchpad-integration/addresses.json) — per-chain address map + init
  hashes + fee tiers. **Import this.**
- [`abis/`](../../launchpad-integration/abis) — clean JSON ABIs (V2 factory/router, V3 factory,
  NPM, QuoterV2, ERC20).
- [`examples/`](../../launchpad-integration/examples) — full v2 and v3 create+seed flows (ethers v6).
