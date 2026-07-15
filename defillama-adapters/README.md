# HookSwap — DefiLlama adapters

Adapters that list **HookSwap** (a self-hosted Uniswap **v2 + v3** fork, `supportsV4:false` — no v4/hooks
on-chain) on DefiLlama. Two independent DefiLlama systems, so two files:

| File (here) | DefiLlama repo | Goes at | Produces |
|---|---|---|---|
| `hookswap/index.js` | [`DefiLlama/DefiLlama-Adapters`](https://github.com/DefiLlama/DefiLlama-Adapters) | `projects/hookswap/index.js` | **TVL** |
| `dexs/hookswap/index.ts` | [`DefiLlama/dimension-adapters`](https://github.com/DefiLlama/dimension-adapters) | `dexs/hookswap/index.ts` | **Volume + Fees** (one file drives both the /dexs and /fees dashboards) |

Everything below is **verified**, not assumed. Every address comes from `contracts/deployments/<chain>.json`
in this repo, and every DefiLlama-side fact was read live on 2026-07-15 (see "Evidence").

---

## What is wired

**Enabled now: Robinhood Chain only (chainId 4663)** — the sole HookSwap chain with confirmed on-chain
liquidity at time of writing.

| Field | Value | Source |
|---|---|---|
| chainId | `4663` | `eth_chainId` → `0x1237` (live) |
| RPC | `https://rpc.mainnet.chain.robinhood.com` | `contracts/deployments/robinhood.json`; identical to `@defillama/sdk` provider `robinhoodchain` |
| v2Factory | `0xD1Cf664944173140AFc302c169eFD55c24966B45` | `robinhood.json` |
| v3Factory | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` | `robinhood.json` (0 pools yet → v3 left disabled) |
| WETH | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` | `robinhood.json` `weth9` |
| USDG (6 dec) | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | `robinhood-production.json` (Global Dollar stablecoin anchor) |
| tHOOK (test) | `0x3b5a01Efc59f3465b8Eb04697f97CFE0BA700D9D` | `contracts/seed/config/robinhood-3pools.json` |
| v2 pool fee | 0.30% (`feeTier` 3000) | data-api `/v1/pools` |

Live v2 pairs (`v2Factory.allPairsLength()` == **2**): WETH/tHOOK `0xbf54dFaC…` and WETH/USDG `0xF7ddC383…`.

**Other HookSwap chains** (factories deployed, RPC already in `@defillama/sdk`, but no confirmed live
liquidity yet — listed as commented, ready-to-enable configs in both adapter files):
MegaETH 4326 (`megaeth`), Ink 57073 (`ink`), XLayer 196 (`xlayer`), HyperEVM 999 (`hyperliquid`),
Tempo 4217 (`tempo`).

---

## Data source chosen (and why)

**On-chain reads**, the idiomatic DefiLlama path — NOT a subgraph, NOT the HookSwap data-api.

- **No public subgraph** exists for HookSwap, so the usual `getGraphDimensions2`/subgraph helper is not
  applicable. HookSwap self-hosts `data.hookswap.org` (returns USD TVL/volume) but DefiLlama's frameworks
  expect DefiLlama-priced, on-chain-derived numbers, so the data-api is used only as a cross-check.
- **TVL** = `getUniTVL({ chain, factory, useDefaultCoreAssets:true })` (`helper/unknownTokens`): enumerates
  pairs via `allPairsLength()/allPairs()` and sums reserves; DefiLlama prices the tokens.
- **Volume + Fees** = `uniV2Exports({ [chain]: { factory, fees:0.003, start } }, { methodology })`
  (`helpers/uniswap`): reads UniswapV2 `Swap` events per pair; fees = volume × 0.30%.

### Proof the numbers are real (data-api cross-check, live 2026-07-15)

`GET https://data.hookswap.org/v1/stats?chainId=4663`:
```json
{"dailyProtocolTvl":{"v2":[{"currency":"USD","value":33.07083929722935}]},
 "historicalProtocolVolume":{"Month":{"v2":[{"currency":"USD","value":2.593321026020569}]}}}
```
`GET https://data.hookswap.org/v1/pools?chainId=4663` → WETH/USDG pool `stats`: `tvl 32.30`, `volume1d 2.59`,
`apr 8.79`; WETH/tHOOK pool `tvl 0.7687`. Liquidity is intentionally thin (seed stage) but the values are
**real and non-fabricated**. DefiLlama coins already prices the two real tokens: WETH ≈ `$1924.98`,
USDG ≈ `$1.0019`. tHOOK is an unlisted test token with no market → priced `$0` (honest; only genuine
reserves count toward USD TVL).

---

## Steps to actually list HookSwap on DefiLlama

DefiLlama sources a chain's chainId + RPC from `@defillama/sdk`'s `build/providers.json`, and token prices
from its coins service ([docs: add a new chain](https://docs.llama.fi/list-your-project/how-to-add-a-new-blockchain)).

### Good news — the chain is already half-supported
- **RPC/chainId already present.** `@defillama/sdk` `build/providers.json` already contains
  `"robinhoodchain": { rpc:["https://rpc.mainnet.chain.robinhood.com"], chainId:4663 }` — the exact
  HookSwap RPC. So on-chain reads resolve **without a new-chain PR**. (Same for `xlayer`, `megaeth`,
  `ink`, `tempo`, `hyperliquid`/999 — all already in providers.json.)
- **Token prices already exist** for the two real tokens (WETH, USDG) via DefiLlama coins.

### PRs / steps required
1. **DefiLlama-Adapters PR** — add `projects/hookswap/index.js` (this repo's `hookswap/index.js`).
   - Confirm the chain slug (see discrepancy below). `projects/helper/chains.json` already lists
     `"robinhood"`.
   - (Optional, improves pricing) add HookSwap tokens to `projects/helper/tokenMapping.js` for the chain,
     mapping WETH→`coingeckoId` (weth/ethereum) and USDG→`global-dollar`, so core-asset pricing is
     deterministic rather than relying on coins auto-discovery.
2. **dimension-adapters PR** — add `dexs/hookswap/index.ts` (this repo's `dexs/hookswap/index.ts`).
   `helpers/chains.ts` already defines `CHAIN.ROBINHOOD = "robinhood"`.
3. **Protocol metadata** — register HookSwap in DefiLlama's protocols/config (name, logo, url
   `https://hookswap.org`, twitter, category `Dexes`, chain(s)) as part of the PR review.

### ⚠️ Chain-slug discrepancy — the one thing to confirm with maintainers
There are **two different Robinhood slugs** in DefiLlama, and they must be reconciled:

| Where | Robinhood string |
|---|---|
| `@defillama/sdk` providers.json (carries RPC + chainId 4663) | **`robinhoodchain`** |
| DefiLlama-Adapters `projects/helper/chains.json` | `robinhood` |
| dimension-adapters `helpers/chains.ts` `CHAIN.ROBINHOOD` | `robinhood` |
| DefiLlama coins prices observed | WETH under `robinhood:…`, USDG under `robinhoodchain:…` |

The TVL adapter's `CHAIN` constant is set to **`robinhoodchain`** (the only slug proven to carry the RPC);
the volume adapter's `CHAIN` is set to **`robinhood`** (the dimension-adapters enum value). Whichever string
each harness uses to resolve an RPC must be a `providers.json` key — confirm with DefiLlama whether
`robinhood` is aliased to `robinhoodchain`, or align both. Each adapter isolates this in a single top-level
constant, so aligning is a 1-line change. **This can only be settled by running each DefiLlama repo's test
locally** (`npm test`), which is not possible from this repo.

### Testable now vs. blocked
- **Testable now:** `node --check hookswap/index.js` passes (done); addresses/chainId/RPC/fee all verified
  on-chain; data-api cross-check returns real USD numbers.
- **Blocked on the DefiLlama toolchain (not this repo):** actually *running* the adapters
  (`getUniTVL`/`uniV2Exports` need `@defillama/sdk` + the repo's helpers installed) and confirming the
  chain-slug resolves an RPC in each harness. The `.ts` volume adapter compiles under dimension-adapters'
  TS config (can't `node --check` a `.ts` here).
- **Not a blocker, but shapes the number:** thin seed liquidity → small TVL/volume today; grows as
  liquidity is seeded. tHOOK stays `$0` until/if it gets a market price.

---

## Evidence (commands run 2026-07-15)
- `eth_chainId` → `0x1237` (4663); `v2Factory.allPairsLength()` → `0x2`.
- `@defillama/sdk` providers.json (unpkg `@defillama/sdk/build/providers.json`): keys `robinhoodchain`
  (4663, correct RPC), `xlayer` (196), `megaeth` (4326), `ink` (57073), `tempo` (4217), `hyperliquid` (999).
- `DefiLlama-Adapters/projects/helper/chains.json`: contains `robinhood`, `xlayer`, `megaeth`, `ink`,
  `tempo`, `hyperliquid`.
- `dimension-adapters/helpers/chains.ts`: `ROBINHOOD="robinhood"`, `XLAYER="xlayer"`, `MEGAETH="megaeth"`,
  `INK="ink"`, `TEMPO="tempo"`, `HYPERLIQUID="hyperliquid"`.
- `coins.llama.fi/prices/current`: `robinhood:WETH`=$1924.98, `robinhoodchain:USDG`=$1.0019.
- Helper signatures confirmed from source: `getUniTVL({ chain, factory, useDefaultCoreAssets })`
  (`helper/unknownTokens` → `helper/cache/uniswap.js`), `uniV3Export({ [chain]:{ factory, fromBlock } })`
  (`helper/uniswapV3.js`), `mergeExports(...)` (`helper/utils.js`),
  `uniV2Exports(config,{...})` with per-chain `{ factory, fees=0.003, start }` (`helpers/uniswap.ts`).
