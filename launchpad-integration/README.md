# HookSwap — Third-Party Launchpad Integration

Everything an external launchpad (pump.fun-style bonding-curve launcher) needs to **create and seed liquidity pools on HookSwap** so that graduated tokens become swappable and routable on HookSwap.

- **What HookSwap is:** a fork of the Uniswap DEX with HookSwap's **own** deployed contracts — a full **v2 (constant-product AMM) + v3 (concentrated-liquidity) + Universal Router** stack on 6 production chains, plus Sepolia (canonical Uniswap) for testing.
- **No v4 / no hooks.** Despite the name, HookSwap ships v2 + v3 only. There is **no PoolManager, no hooks, no v4 pools.** Do not attempt v4 flows — they will not exist on-chain. Pool creation is the classic v2 `createPair` / v3 `NonfungiblePositionManager` path.
- The addresses below are **HookSwap's own deployments** (canonical Uniswap bytecode → canonical init-code hashes → only the factory/manager addresses differ from Uniswap). WETH/wrapped-native is each chain's existing canonical wrapper. Permit2 is the canonical CREATE2 deployment (same address everywhere).

## Why a launchpad integrates

A bonding-curve launch accumulates reserves (token + quote asset) as buyers ape in. On **graduation**, the launchpad deposits that accumulated liquidity into a real AMM pool so the token trades freely. Integrating with HookSwap means:

1. You call HookSwap's **v2 factory + router** (simplest) or **v3 NonfungiblePositionManager** (capital-efficient) to create and seed the pool.
2. Once the pool holds liquidity, HookSwap's routing/interface can **quote and route swaps** against it — the token is live on HookSwap.
3. **Pair the launched token against the chain's WETH / wrapped-native** so routing discovers it automatically (see [Recommended graduation pattern](#recommended-graduation-pattern)).

---

## Per-chain addresses

`permit2` is the canonical `0x000000000022D473030F116dDEE9F6B43aC78BA3` on **every** chain. Machine-readable copy: [`addresses.json`](./addresses.json).

### Deterministic group — MegaETH (4326), Robinhood (4663), Ink (57073)
These three share identical addresses (CREATE2/nonce-0 deploy). Only WETH differs.

| Contract | Address |
|---|---|
| v2Factory | `0xD1Cf664944173140AFc302c169eFD55c24966B45` |
| v2Router02 | `0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA` |
| v3Factory | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` |
| NonfungiblePositionManager | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| SwapRouter02 | `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4` |
| QuoterV2 | `0x15cD41B273865feD20BC8B5cDF4423D7678ac78E` |
| UniversalRouter | `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` |
| **WETH** — MegaETH | `0x4200000000000000000000000000000000000006` |
| **WETH** — Ink | `0x4200000000000000000000000000000000000006` |
| **WETH** — Robinhood | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` |

### Unique addresses — XLayer (196), HyperEVM (999), Tempo (4217)
Deployed at a non-zero deployer nonce, so addresses differ per chain. **Read them per-chain — do not assume the deterministic set.**

| Contract | XLayer (196) | HyperEVM (999) | Tempo (4217) |
|---|---|---|---|
| v2Factory | `0xD1Cf664944173140AFc302c169eFD55c24966B45` | `0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2` | `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4` |
| v2Router02 | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` | `0x6d8a0783213B3b06648DB3708a89732af3661005` |
| v3Factory | `0xAB34Bb3767020059A35e71D03f13E9e4fbCD07aC` | `0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A` | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` |
| NonfungiblePositionManager | `0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A` | `0x86426094d82bC1fd40F0901965b23D30837Dc66b` | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| SwapRouter02 | `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` | `0xD96fc9629AFaf325fCdd7F98Dc9b8dc2165adcBB` | `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` |
| QuoterV2 | `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4` | `0x3b5a01Efc59f3465b8Eb04697f97CFE0BA700D9D` | `0x15cD41B273865feD20BC8B5cDF4423D7678ac78E` |
| UniversalRouter | `0x6d8a0783213B3b06648DB3708a89732af3661005` | `0xD9d4795F2A12305a12C36455ADAD011F2D6143AB` | `0x62aE013cb2b232C20094B466C94bb39714eF661E` |
| WETH / wrapped | `0xe538905cf8410324e03A5A23C1c177a474D59b2b` (WOKB) | `0x5555555555555555555555555555555555555555` (WHYPE) | `0xBbBcC62853a5fA27b93d6Bab3E6F7ce841E25Df2` (WETH9 arg only)¹ |

¹ **Tempo has no native-gas wrapper.** Gas is paid in `pathUSD` (an ERC-20). The WETH9 address above is only the router/periphery constructor arg — do **not** use `addLiquidityETH` / `msg.value` on Tempo. Create token/token pairs against `pathUSD` or another ERC-20 quote asset instead.

### Sepolia (11155111) — testnet, canonical Uniswap
HookSwap reuses Uniswap's canonical Sepolia deployment for testing.

| Contract | Address |
|---|---|
| v2Factory | `0xF62c03E08ada871A0bEb309762E260a7a6a880E6` |
| v2Router02 | `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3` |
| v3Factory | `0x0227628f3F023bb0B980b67D528571c95c6DaC1c` |
| NonfungiblePositionManager | `0x1238536071E1c677A632429e3655c799b22cDA52` |
| SwapRouter02 | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E` |
| QuoterV2 | `0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3` |
| UniversalRouter (v2_0) | `0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b` |
| WETH | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |

---

## Init code hashes & fee tiers

The deployed bytecode is standard Uniswap, so the init-code hashes are the **canonical** values and are **identical on every chain**. Use them for off-chain deterministic pool/pair address computation (e.g. `getCreate2Address`).

| | Init code hash |
|---|---|
| **v2 pair** | `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f` |
| **v3 pool** | `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54` |

**v3 fee tiers** (fee is in hundredths of a bip; `3000` = 0.30%):

| fee | tickSpacing |
|---|---|
| `100` (0.01%) | `1` |
| `500` (0.05%) | `10` |
| `3000` (0.30%) | `60` |
| `10000` (1.00%) | `200` |

`tickLower` / `tickUpper` **must** be multiples of the pool's `tickSpacing`, or `mint` reverts.

---

## v2 flow (simplest — recommended for most graduations)

v2 is a single-tier constant-product pool. You deposit both sides at the current ratio; that ratio **defines the opening price**. No tick math.

**Steps**

1. **Create the pair** (idempotent — skip if it already exists):
   `IUniswapV2Factory(v2Factory).createPair(token, WETH)` — or read `getPair(token, WETH)`; a zero address means it does not exist yet. `addLiquidityETH` will auto-create the pair on first deposit, so this step is optional.
2. **Approve the router** to pull your token: `IERC20(token).approve(v2Router02, amountTokenDesired)`.
3. **Add liquidity** (token + native gas asset):
   `UniswapV2Router02.addLiquidityETH{value: ethAmount}(token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline)`.
   For a token/token pool (or on Tempo), use `addLiquidity(tokenA, tokenB, ...)` with both sides approved.

The **opening price** is set by the ratio `amountTokenDesired : ethAmount`. On a fresh pair, whatever ratio you deposit *is* the price. Set `amountTokenMin`/`amountETHMin` to your exact amounts on a fresh pair (no slippage possible), or slightly below for an existing pair.

**ethers.js (v6) sketch** — full runnable version in [`examples/createV2Pair.ts`](./examples/createV2Pair.ts):

```ts
const factory = new ethers.Contract(a.v2Factory, V2FactoryAbi, signer);
const router  = new ethers.Contract(a.v2Router02, V2Router02Abi, signer);
const token   = new ethers.Contract(launchedToken, ERC20Abi, signer);

// 1. create pair (optional; addLiquidityETH also creates it)
if ((await factory.getPair(launchedToken, a.weth)) === ethers.ZeroAddress) {
  await (await factory.createPair(launchedToken, a.weth)).wait();
}
// 2. approve
await (await token.approve(a.v2Router02, amountTokenDesired)).wait();
// 3. seed
const deadline = Math.floor(Date.now() / 1000) + 1200;
await (await router.addLiquidityETH(
  launchedToken, amountTokenDesired, amountTokenDesired, ethAmount, treasury, deadline,
  { value: ethAmount }
)).wait();
```

---

## v3 flow (concentrated liquidity)

v3 pools are per **(token0, token1, fee)**. Price is stored as `sqrtPriceX96` and liquidity is placed between two ticks. This is where integrators get it wrong — read the math below carefully.

**Steps**

1. **Sort the tokens.** `token0 < token1` by byte value (lowercase-hex compare). Uniswap always orders them; if you pass them unsorted the price is inverted.
2. **Compute `sqrtPriceX96`** from your intended launch price `P = token1-per-token0` (in raw/wei units, i.e. price already adjusted for decimals):
   `sqrtPriceX96 = floor(sqrt(P) * 2**96)`.
   Because `P` is `amount1 / amount0` and you sorted the tokens in step 1, **`P` is priced in token1 units per 1 token0**. If your human price is "quote per launched-token", map launched/quote onto token0/token1 accordingly and invert if the launched token sorted as token1. See the helper in the example.
3. **Create + initialize the pool** (idempotent):
   `NonfungiblePositionManager.createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96)`. If the pool already exists it is a no-op and the existing price stands.
4. **Approve** the NPM for both sides you intend to deposit: `IERC20(token0).approve(NPM, amount0)` and same for token1.
5. **Mint the position** with `NonfungiblePositionManager.mint(MintParams)`:

   ```
   MintParams {
     address token0; address token1; uint24 fee;
     int24 tickLower; int24 tickUpper;          // MUST be multiples of tickSpacing
     uint256 amount0Desired; uint256 amount1Desired;
     uint256 amount0Min; uint256 amount1Min;    // slippage floor
     address recipient; uint256 deadline;
   }
   ```

**Tick math**

- The price at a tick is `1.0001^tick = P`, so `tick = floor( log(P) / log(1.0001) )`.
- **Round to the fee tier's `tickSpacing`:** `tickLower = floor(tick/spacing)*spacing`, and pick `tickUpper` likewise. Both endpoints must be multiples of `spacing` — otherwise `mint` reverts with `TLU`/tick errors.
- For a **full-range** position (equivalent to v2), use the tier's usable min/max: `tickLower = ceil(MIN_TICK/spacing)*spacing`, `tickUpper = floor(MAX_TICK/spacing)*spacing`, where `MIN_TICK = -887272`, `MAX_TICK = 887272`. For `spacing = 60` that is `[-887220, 887220]`; for `200` it is `[-887200, 887200]`.
- **The current tick must sit inside `[tickLower, tickUpper]`**, otherwise you deposit only one side of the pair (a single-sided range order) — usually not what a graduation wants.

Full runnable version with the `priceToSqrtPriceX96`, `priceToTick`, and `nearestUsableTick` helpers in [`examples/createV3Pool.ts`](./examples/createV3Pool.ts).

---

## Recommended graduation pattern

- **Pair the launched token against the chain's WETH / wrapped-native** (`weth` field per chain above). HookSwap's router and interface treat WETH as a base/connector token, so **token→WETH pools are discovered automatically** for routing and quoting. A brand-new token/WETH pool is immediately routable.
- **Arbitrary token/token pairs** (e.g. token/USDC) are valid but are **not** auto-discovered by routing unless the pair is indexed by HookSwap's subgraph (the v2/v3 subgraph feeds the router's pool list). If you must pair against a non-WETH quote, ensure that pool is picked up by the HookSwap subgraph or the token will exist but not route through multi-hop paths.
- **On Tempo**, there is no native-gas wrapper — pair against `pathUSD` or another liquid ERC-20 quote and use `addLiquidity` (token/token), never `addLiquidityETH`.
- Prefer **v2** for a simple "throw both sides in at a fixed ratio" graduation. Prefer **v3** only if you want concentrated liquidity / capital efficiency and can compute ticks correctly.

---

## How to verify a pool is live & quotable

**v2 — check reserves:**
- `pair = IUniswapV2Factory(v2Factory).getPair(token, WETH)` → non-zero address means the pair exists.
- On the pair, `getReserves()` returns `(reserve0, reserve1, _)` — both non-zero means it holds liquidity.

**v3 — check the pool & quote:**
- `pool = IUniswapV3Factory(v3Factory).getPool(token0, token1, fee)` → non-zero means it exists.
- Call **QuoterV2** (static-call, it is not `view` — it reverts internally to return data, so use `callStatic` / `.staticCall`):
  ```ts
  const quoter = new ethers.Contract(a.quoterV2, QuoterV2Abi, provider);
  const [amountOut] = await quoter.quoteExactInputSingle.staticCall({
    tokenIn: launchedToken, tokenOut: a.weth, amountIn, fee: 3000, sqrtPriceLimitX96: 0n,
  });
  ```
  A non-zero `amountOut` for a small `amountIn` confirms the pool has liquidity and quotes correctly. The same QuoterV2 works for v2 legs only via SwapRouter02/UniversalRouter; for pure v2 verification use reserves.

---

## Files in this package

- [`addresses.json`](./addresses.json) — machine-readable per-chain address map + init hashes + fee tiers. **Import this.**
- [`abis/`](./abis) — clean JSON ABIs: `UniswapV2Factory`, `UniswapV2Router02`, `UniswapV3Factory`, `NonfungiblePositionManager`, `QuoterV2`, `ERC20`. See [`abis/README.md`](./abis/README.md).
- [`examples/createV2Pair.ts`](./examples/createV2Pair.ts) — full v2 create + seed flow (ethers v6).
- [`examples/createV3Pool.ts`](./examples/createV3Pool.ts) — full v3 create + initialize + mint flow with correct sqrtPriceX96 / tick helpers.

> Addresses sourced from `contracts/deployments/*.json` (HookSwap-owned deploys) and `@uniswap/sdk-core` (Sepolia canonical). If a chain redeploys, regenerate `addresses.json` from the deployment JSONs.
