# HookSwap data-api

HookSwap's **own** data backend (the "indexer" service), independent of Uniswap. It speaks the
exact **Connect-RPC / protobuf** service the HookSwap interface already calls —
`data.v1.DataApiService` from the published `@uniswap/client-data-api` package — so the interface
can point its data transport here instead of Uniswap's hosted data-api (which only serves Uniswap
chains).

Because the server is built against the **same generated proto Message classes** the client imports,
request/response types are guaranteed to match — there is no hand-written schema to drift.

> **Phase 1 (this service): CURRENT-STATE data from live on-chain reads only.** No historical
> database, no event indexer, no USD price oracle yet. Token lists and the pool table are real and
> live; anything that needs history or USD (volume, TVL-in-USD, charts, portfolio P/L) is an honest
> stub until Phase 2.

## What the interface uses this for

| Frontend hook | RPC method | This service |
|---|---|---|
| `useListTokens` (Markets, token pickers, Explore) | `DataApiService.listTokens` | ✅ **real** — native + wrapped-native + seeded ERC-20s per chain |
| `useTopPools` (Markets pool table) | `DataApiService.listTopPools` | ✅ **real** — live v2 pools discovered on-chain (token0/token1, fee tier, existence) |
| portfolio / balances / activity | `getPortfolio`, `getWalletBalances`, `listTransactions`, … | ⏳ **stub** — valid empty responses (need Phase-2 indexer) |
| everything else in the service | (all other methods) | ⏳ **stub** — valid empty responses |

## Implemented, in detail

### `listTokens` → `ListTokensResponse`
For each requested (and supported) chain it emits `data.v1.Token` messages:
- **native** — `type = TOKEN_TYPE_NATIVE`, `address = ""` (native sentinel — we do **not** invent a
  contract address), `symbol/name/decimals` from chain config.
- **wrapped-native** — real ERC-20, `type = TOKEN_TYPE_ERC20`, real address/symbol/name/decimals.
- **seeded tokens** — the chain's verified seeded ERC-20s (e.g. Robinhood **tHOOK**).

Fields populated: `chain_id`, `address`, `symbol`, `name`, `decimals`, `type`. `metadata` and
`stats` are intentionally left unset (no logo registry / USD oracle / volume indexer yet).

### `listTopPools` → `ListTopPoolsResponse`
Discovers each chain's live **v2** pools without an indexer: it CREATE2-computes the pair address for
every `{wrapped-native, seeded-token}` combination (canonical v2 init-code hash + the chain's
HookSwap v2 factory), checks the address has deployed code, and reads live
`getReserves()` / `token0()` / `token1()`. Empty/non-existent pools are skipped. Each surviving pool
becomes a `data.v1.Pool`:
- `chain_id`, `pool_id` = the pair contract address
- `token0` / `token1` = real `data.v1.Token`s
- `protocol_version` = `PROTOCOL_VERSION_V2`
- `fee_tier` = `3000` (v2's fixed 0.30%, in pips)
- `is_dynamic_fee` = `false`
- `stats` **omitted** — `tvl` needs a USD oracle, `volume`/`apr` need a historical indexer. Neither
  exists in Phase 1, so value metrics render as "—" rather than fabricated numbers.

## Honest pricing / TVL (no fake USD)

There is **no USD oracle** on these chains. We therefore never emit a USD price or USD TVL.
`src/onchain.ts::getSpotPrices` can derive a token's price **denominated in the wrapped-native**
from live pool reserves (`reserveNative / reserveToken`), and explicitly returns `usd: undefined`.
Those native-denominated ratios are **not** written into any USD-semantic proto field, because the
UI would render them as dollars. Result: real data where it's real, honest empty/"—" where a USD
reference doesn't exist. (Matches the project's no-mock-data rule.)

## Stubbed, and why

Every other `DataApiService` method returns a **valid empty response Message** (not an error), so the
interface degrades gracefully (empty states) instead of crashing. These need Phase 2:
- **Portfolio / balances / P&L** (`getPortfolio`, `getWalletBalances`, `getWalletProfitLoss`, …) —
  need per-wallet balance indexing + USD valuation.
- **Transactions / activity** (`listTransactions`, `getTransaction`) — need an event indexer.
- **Charts** (`getPortfolioChart`, token price history) — need historical time-series storage.
- **Protocol stats** (`getProtocolStats`) — needs aggregate TVL/volume (indexer + USD).
- **Positions / rewards / RWAs / token-factory / reports** — out of Phase-1 scope.

## Chains served

Config lives in `src/chains.ts` (copied from `trading-api-adapter/src/chains.ts`, the single source
of truth for the deployed HookSwap stack). **Robinhood (4663) is the priority** — it has a seeded
WETH/tHOOK v2 pool, so `listTopPools` returns a real pool there today. Also included: MegaETH (4326),
Ink (57073), XLayer (196), HyperEVM (999), Sepolia (11155111). Chains with a `seededTokens` entry
yield discoverable pools; others serve wrapped-native token metadata only until they're seeded.

## Run locally

```bash
cd data-api
npm install            # deps are NOT committed (disk-constrained checkout)
cp .env.example .env   # adjust CORS_ALLOW_ORIGIN / RPC URLs
npm run dev            # ts-node, or: npm run build && npm start
# health:
curl http://localhost:4092/health
```

Smoke-test the two real methods (Connect unary is a POST of the JSON request body):

```bash
# listTokens for Robinhood
curl -X POST http://localhost:4092/data.v1.DataApiService/ListTokens \
  -H 'Content-Type: application/json' -d '{"chainIds":[4663]}'

# listTopPools for Robinhood (returns the seeded WETH/tHOOK pool)
curl -X POST http://localhost:4092/data.v1.DataApiService/ListTopPools \
  -H 'Content-Type: application/json' -d '{"chainIds":[4663]}'
```

## Type-check note

This checkout has **no `node_modules`** (disk-constrained). `npm run typecheck` requires
`npm install` first. The handlers were written against the actual proto `.d.ts` field names in
`node_modules/@uniswap/client-data-api/dist/data/v1/{api_pb,types_pb,poolTypes_pb}.d.ts` (not
guessed). See `DEPLOY.md` for the install + typecheck step to run on the VPS.

## Deploy + frontend wiring

See `DEPLOY.md`. In short: run it as a systemd Node service behind nginx on `data.hookswap.org`
(mirrors the trading adapter's pattern), then point the interface's v2 Connect transport base URL at
it (a config/env change — documented in DEPLOY.md, **not** done in this task).
