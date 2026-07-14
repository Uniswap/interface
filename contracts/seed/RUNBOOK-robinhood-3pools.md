# RUNBOOK — Robinhood (4663) 3-pool liquidity seed (the "Mixed" set, ~$15/side)

Creates/deepens **three v2 pools** so Markets/Pools/Portfolio show real, tradeable
liquidity. Claude cannot broadcast (no funded key) — **Reggie runs the broadcast**
with the deployer key in `contracts/.env`.

Config: [`config/robinhood-3pools.json`](config/robinhood-3pools.json)
· anchor-only re-run slice: [`config/robinhood-usdg-anchor.json`](config/robinhood-usdg-anchor.json)

The three pools:

| # | Pool | Action | External dep |
| --- | --- | --- | --- |
| 1 | WETH / tHOOK | **deepen** existing dust pair (1:1000) | none — tHOOK already held |
| 2 | WETH / tROBIN | **create** new pool, fresh mintable test token | none — minted by seeder |
| 3 | WETH / USDG | **create** stablecoin **anchor** (unlocks USD app-wide) | **must acquire 15 real USDG** |

---

## Verified facts (on-chain, RH mainnet RPC, 2026-07-13)

| Fact | Value | Source |
| --- | --- | --- |
| chainId | 4663 (`0x1237`) | `eth_chainId` |
| WETH/tHOOK pair | `0xbf54dFaC1fB1820fBeb5Be6fF09c4dc990DC0dC6` | seeder resolves via `getPair` |
| pair token0 / token1 | WETH `0x0Bd7…AcAD73` / tHOOK `0x3b5a…00D9D` | `token0()` / `token1()` |
| current reserves | **0.0002 WETH / 0.2 tHOOK** (raw 2e14 / 2e17) | `getReserves()` |
| pool ratio | **exactly 1 WETH : 1000 tHOOK** | reserves |
| deployer native ETH | **~0.0598 ETH** — enough for all 3 WETH legs + gas, **no funding needed** | `eth_getBalance` (`0xd476347f36bc22`) |
| deployer tHOOK balance | **~999.9B** — plenty | `balanceOf` |
| deployer USDG balance | **0** — MUST acquire ≥15 USDG (non-mintable) | `balanceOf` |
| USDG token | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` (6 dec, Global Dollar) | given |
| gas price | chains.json floor **0.07 gwei** (base fee ~0.05) | chains.json |
| ETH/USD | **1782.93** (CoinDesk 2026-07-13) → $15 = 0.008413 WETH | web |

**Seed amounts (per pool, WETH leg = $15 at 1782.93):**

| Pool | amountA (WETH) | raw A | amountB | raw B |
| --- | --- | --- | --- | --- |
| 1 WETH/tHOOK | 0.008413 | `8413000000000000` | 8.413 tHOOK | `8413000000000000000` |
| 2 WETH/tROBIN | 0.008413 | `8413000000000000` | 8.413 tROBIN | `8413000000000000000` |
| 3 WETH/USDG | 0.008413 | `8413000000000000` | 15.0 USDG | `15000000` |

Total WETH auto-wrapped from native ETH = **0.025239 WETH** (deployer's ~0.0598 ETH
covers it; ~0.0346 ETH left for gas).

**Price-impact caveat (honest):** each pool is ~$30 TVL — thin. A ~$1 swap ≈ 6–7%
impact, ~$3 ≈ ~18%. Good for demo swaps at reasonable slippage; deepen for real
trading. The USDG anchor only needs to **exist at the right price** to unlock
app-wide USD — its depth need not be large.

---

## What the seeder does (verified from `script/SeedPools.s.sol` + `scripts/seed.sh`)

`seed.sh` loops the config and runs `SeedPools.s.sol` **once per pool**, in array
order, **stopping on the first failure** (`Nothing after this pool ran`). Per pool
(`_seedV2`, lines 128–148):

1. `factory.getPair(A, B)` — reuse if it exists (pool 1), else `createPair` (pools 2, 3).
2. For a `MINT` token (pool 2 tROBIN): deploy a fresh `MockERC20` and mint 1e12 to the deployer (`_resolveToken`, lines 105–113).
3. `_prepare(WETH, router, rawA)` (lines 284–294): deployer WETH balance is 0 → **auto-wraps** the shortfall from native ETH (`IWETH.deposit{value: short}`), needs `deployer.balance ≥ short`; then `approve(router, max)`.
4. `_prepare(tokenB, router, rawB)`: tHOOK/tROBIN already held → just `approve`. **USDG** (pool 3): needs `balanceOf(deployer) ≥ 15e6` or it **reverts** `insufficient token balance to seed pool`.
5. `router.addLiquidity(A, B, rawA, rawB, 0, 0, deployer, now+3600)` — `amountMin = 0`. For pool 1 the ratio matches reserves (both sides consumed in full, no price move); for new pools 2/3 the deposit ratio **sets** the initial price.

> `SeedLiquidity.s.sol` in this dir is a *different* one-off — `seed.sh` runs `SeedPools.s.sol`.

---

## Step 0 — Acquire USDG (the only blocker)

The deployer holds **0 USDG**. Acquire **≥ 15 USDG** (`0x5fc5360D…`) to the deployer
`0xc14C897c6bff88a5Eeac31F795693b9230205125` on Robinhood chain before broadcasting
pool 3. (Native ETH is already sufficient — no ETH top-up needed.) Confirm:

```bash
cast call 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168 \
  "balanceOf(address)(uint256)" 0xc14C897c6bff88a5Eeac31F795693b9230205125 \
  --rpc-url https://rpc.mainnet.chain.robinhood.com
# expect >= 15000000  (15 USDG, 6 decimals)
```

> If you want pools 1+2 live **now** and USDG later: broadcast the full file anyway
> (pool 3 will simply revert and stop after 1+2 succeed), **then** run the
> anchor-only slice once USDG lands (see "Anchor later" below). Do NOT re-run the
> whole file after a partial success — pools 1/2 are not idempotent (they'd add again).

---

## Step 0.5 — Refresh the USDG anchor price to live

ETH/USD drifts. Before broadcasting pool 3, set its `priceAperB` **and** `amountB`
so `amountB / amountA` equals the **live** USDG-per-WETH rate (keep both legs ~equal
USD). Example at a live rate of `R` USD/ETH with amountA `0.008413`: `amountB = 0.008413 × R`,
`priceAperB = R`. The Phase-2 indexer reads this pool's reserves as `usdPerNative`, so
a wrong ratio mis-prices **every** USD value in the app.

---

## Step 1 — Dry-run (simulate; spends nothing)

```bash
cd contracts/seed
SEED_POOLS=config/robinhood-3pools.json ./scripts/seed.sh robinhood
```

Expect 3 pool blocks: pool 1 logs `v2 pair exists: 0xbf54dFaC…0dC6`; pool 2 logs
`minted MockERC20 tROBIN 0x…` then `created v2 pair`; pool 3 logs `created v2 pair`
and simulates `addLiquidity` with `amountB(raw): 15000000`. No revert on any pool = good.
(If pool 3 reverts `insufficient token balance`, USDG isn't acquired yet — do Step 0.)

---

## Step 2 — Broadcast (spends gas + wraps 0.025239 ETH)

```bash
cd contracts/seed
SEED_POOLS=config/robinhood-3pools.json ./scripts/seed.sh robinhood --broadcast
```

---

## Step 3 — Verify

**Pool 1 (WETH/tHOOK) grew** — reserve0≈`0.008613` WETH raw `8613000000000000`,
reserve1≈`8.613` tHOOK raw `8613000000000000000` (old 0.0002/0.2 + new 0.008413/8.413):

```bash
cast call 0xbf54dFaC1fB1820fBeb5Be6fF09c4dc990DC0dC6 \
  "getReserves()(uint112,uint112,uint32)" \
  --rpc-url https://rpc.mainnet.chain.robinhood.com
```

**Pools 2 & 3 created** — find the new pairs via the v2 factory `getPair`
(factory `0xD1Cf664944173140AFc302c169eFD55c24966B45`; tROBIN address is printed in
the broadcast log):

```bash
# WETH/USDG anchor:
cast call 0xD1Cf664944173140AFc302c169eFD55c24966B45 \
  "getPair(address,address)(address)" \
  0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168 \
  --rpc-url https://rpc.mainnet.chain.robinhood.com
# then getReserves() on the returned pair
```

**App-level:** hit `data.hookswap.org` — `listTopPools` for 4663 should now return
3 pools, and once the USDG anchor exists the USD-denominated fields (price/TVL/volume)
begin populating. Quote WETH↔tHOOK and WETH↔USDG through `trading.hookswap.org` to
confirm real routes.

---

## Anchor later (partial-success recovery / deferred USDG)

Once USDG is acquired, seed **only** the anchor (safe to run standalone; refresh the
price first per Step 0.5):

```bash
cd contracts/seed
SEED_POOLS=config/robinhood-usdg-anchor.json ./scripts/seed.sh robinhood            # dry-run
SEED_POOLS=config/robinhood-usdg-anchor.json ./scripts/seed.sh robinhood --broadcast
```

---

## Do NOT

- Do **not** re-run `robinhood-3pools.json` whole after a partial success — pools 1/2
  add liquidity again (not idempotent). Use the anchor-only slice to finish pool 3.
- Do **not** broadcast pool 3 before the deployer actually holds ≥15 USDG — it reverts.
- Do **not** ship pool 3 at a stale price — `amountB/amountA` must equal the live
  USDG-per-WETH rate (it becomes the app's USD oracle).
- Do **not** change pool 1 off the 1:1000 ratio — a mismatch strands the limiting
  side (won't revert, `amountMin=0`, but leftover is wasted).
