# RUNBOOK — Robinhood (4663) $5 production liquidity seed

Ready-to-broadcast deepen of the **existing** WETH/tHOOK v2 pair to ~$5 of WETH.
Claude cannot broadcast (no funded key) — **Reggie runs the broadcast step** with
the deployer key in `contracts/.env`.

Config: [`config/robinhood-production-5usd.json`](config/robinhood-production-5usd.json)
(single v2 pool; the USDG anchor is intentionally omitted — see the `_omitted`
note in that file).

---

## Verified facts (on-chain, RH mainnet RPC, 2026-07-12)

| Fact | Value | Source |
| --- | --- | --- |
| chainId | 4663 (`0x1237`) | `eth_chainId` |
| WETH/tHOOK pair | `0xbf54dFaC1fB1820fBeb5Be6fF09c4dc990DC0dC6` | given / used by seeder via `getPair` |
| pair token0 / token1 | WETH `0x0Bd7…AcAD73` / tHOOK `0x3b5a…00D9D` | `token0()` / `token1()` |
| current reserves | **0.0002 WETH / 0.2 tHOOK** (raw 2e14 / 2e17) | `getReserves()` |
| pool ratio | **exactly 1 WETH : 1000 tHOOK** | reserves |
| deployer WETH balance | **0** | `balanceOf` |
| deployer tHOOK balance | **999,999,999,999.8** (~1e12) — plenty | `balanceOf` |
| deployer native ETH | **0.0000145929 ETH** — MUST be funded | `eth_getBalance` |
| gas price | **0.051352 gwei** (chains.json floor 0.07 gwei clears) | `eth_gasPrice` |
| ETH/USD | 1779.59 → $5 = 0.00281 WETH | given |

**Seed amounts:** `amountA = 0.00281 WETH`, `amountB = 2.81 tHOOK` (exactly 1:1000).
Because our ratio == the on-chain reserve ratio, the v2 router's `addLiquidity`
computes `amountBOptimal == amountBDesired` → **both sides consumed in full, no
leftover, no price move.**

**Resulting reserves:** ~0.00301 WETH / ~3.01 tHOOK (~$10.7 TVL) — **~15x** deeper
than the current dust.

**Price-impact caveat (honest):** at $5 depth the pool only supports tiny swaps —
a ~$0.53 (0.0003 WETH) swap ≈ 9% impact, a ~$1 swap ≈ 16%. This unblocks
routing/quoting; deepen further for real trading.

---

## What the seeder does for this pool (verified from `script/SeedPools.s.sol`)

`seed.sh` invokes `SeedPools.s.sol` once for this v2 pool. Per pool (`_seedV2`, lines 128–148):

1. `factory.getPair(WETH, tHOOK)` — pair **already exists** → logs `v2 pair exists`, reuses it (no `createPair`).
2. `_prepare(WETH, router, 0.00281e18)` (lines 284–294): deployer WETH balance is 0 → **auto-wraps** the 0.00281 shortfall from native ETH (`IWETH.deposit{value: short}`), requiring `deployer.balance >= 0.00281`; then `approve(router, max)`.
3. `_prepare(tHOOK, router, 2.81e18)`: deployer already holds ~1e12 tHOOK → just `approve(router, max)`.
4. `router.addLiquidity(WETH, tHOOK, 0.00281e18, 2.81e18, 0, 0, deployer, now+3600)` — **amountMin = 0**. The router quotes at the current reserve ratio and takes the limiting side; here both sides match exactly so both are used in full.

> Note: `SeedLiquidity.s.sol` (the standalone script in this dir) is a *different*
> one-off that deploys a fresh test token — it is **not** what `seed.sh` runs.
> The config-driven path is `SeedPools.s.sol`, and it adds to the existing pair.

---

## Step 1 — Fund the deployer with native ETH

The seeder auto-wraps WETH from native ETH, so the deployer needs
**≥ 0.00281 ETH (to wrap) + gas**. It currently holds ~0.0000146 ETH.
**Send ~0.0032 ETH** to the deployer (0.00281 wrap + generous gas headroom; a full
seed costs ~0.00004 ETH gas at the 0.07 gwei floor).

```bash
# Deployer to fund:
#   0xc14C897c6bff88a5Eeac31F795693b9230205125
# Send ~0.0032 ETH on Robinhood chain (4663) from any funded wallet, e.g.:
cast send 0xc14C897c6bff88a5Eeac31F795693b9230205125 \
  --value 0.0032ether \
  --rpc-url https://rpc.mainnet.chain.robinhood.com \
  --private-key <A_FUNDING_KEY>

# Confirm the balance (expect >= ~0.0032 ETH):
cast balance 0xc14C897c6bff88a5Eeac31F795693b9230205125 \
  --rpc-url https://rpc.mainnet.chain.robinhood.com
```

Prereqs in `contracts/.env`: `DEPLOYER_PRIVATE_KEY` = the key for
`0xc14C897c…205125` (bare 64-hex or 0x-prefixed).

---

## Step 2 — Dry-run (simulate; spends nothing)

```bash
cd contracts/seed
SEED_POOLS=config/robinhood-production-5usd.json ./scripts/seed.sh robinhood
```

Read the output. Expect it to log `v2 pair exists: 0xbf54dFaC…0dC6` and simulate
`addLiquidity` with `amountA(raw): 2810000000000000` and
`amountB(raw): 2810000000000000000`. No revert = good.

---

## Step 3 — Broadcast (spends gas + wraps 0.00281 ETH)

```bash
cd contracts/seed
SEED_POOLS=config/robinhood-production-5usd.json ./scripts/seed.sh robinhood --broadcast
```

---

## Step 4 — Verify the pool grew

Re-read `getReserves()` on the pair and confirm the reserves increased by the
seed amounts. Expected **after**: reserve0 (WETH) ≈ `3010000000000000` (0.00301),
reserve1 (tHOOK) ≈ `3010000000000000000` (3.01).

**Exact eth_call (getReserves selector `0x0902f1ac`):**

```bash
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0xbf54dFaC1fB1820fBeb5Be6fF09c4dc990DC0dC6","data":"0x0902f1ac"},"latest"]}'
```

Decode: the result is three 32-byte words — `reserve0` (WETH), `reserve1` (tHOOK),
`blockTimestampLast`. reserve0 should read `0x…0ab1943cc62000` (3010000000000000)
and reserve1 `0x…29c5ab0d65ed0000` (3010000000000000000).

**Or with cast (cleaner):**

```bash
cast call 0xbf54dFaC1fB1820fBeb5Be6fF09c4dc990DC0dC6 \
  "getReserves()(uint112,uint112,uint32)" \
  --rpc-url https://rpc.mainnet.chain.robinhood.com
# expect ~3010000000000000  ~3010000000000000000  <timestamp>
```

Then quote WETH↔tHOOK through the trading adapter (`trading.hookswap.org`) to
confirm the router now returns a real route.

---

## Do NOT

- Do not broadcast the WETH/USDG pool from `robinhood-production.json` — the
  deployer holds **0 USDG** (real, non-mintable); acquire USDG first, then seed
  it as a separate step.
- Do not change `priceAperB`, `amountA`, or `amountB` off the 1:1000 ratio — a
  mismatched ratio makes the router take only the limiting side (leftover
  stranded) even though it won't revert (amountMin = 0).
