# HookSwap gateway-schema adapter

A small, self-contained **graphql-yoga** service that serves the **exact Uniswap gateway GraphQL
schema** the HookSwap interface calls (`AWS_API_ENDPOINT`), backed by HookSwap's **own** self-hosted
v3-subgraph for pool/token/price data, and **proxying** everything a subgraph can't serve to the real
Uniswap gateway. It exists because Uniswap's hosted gateway (`beta.gateway.uniswap.org`) only serves
Uniswap chains — the HookSwap interface needs its **own** gateway for chains
4326 / 4663 / 57073 / 196 / 999 / 4217 / 11155111.

> **Status: most subgraph-serveable ops implemented.** The served SDL (copied verbatim from the
> interface), the hybrid local-vs-proxy request router (now **directive-aware** — see below), the
> per-chain subgraph mapping, and the pool / token / price / transaction / chart / tick / fee-tier
> resolvers are real and typed. The remaining subgraph-serveable gaps are marked TODO below.
> **No data is ever fabricated** — an unimplemented op is proxied upstream, or (if
> `UPSTREAM_GATEWAY_URL` is unset) returns a GraphQL error; a missing subgraph value returns `null`.
>
> `src/translate.ts` + `src/resolvers.ts` typecheck clean against the repo toolchain (`tsc --strict`).
> Dependencies are **not installed** in this checkout (disk-constrained), so `src/server.ts` still
> reports `Cannot find module 'graphql-yoga'` (and the `payload: any` that follows from its missing
> `Plugin` type) until `npm install` runs on the VPS — see [DEPLOY.md](./DEPLOY.md).

## How it works (hybrid gateway)

```
HookSwap interface (browser)
   │  POST https://gateway.hookswap.org/v1/graphql   (gateway GraphQL schema)
   ▼
nginx (TLS) ──► gateway-adapter (graphql-yoga, :4000)
                   │
        onParams: is EVERY selected root field subgraph-backed?
             │yes                              │no
             ▼                                 ▼
   execute against schema.graphql      proxy the raw request verbatim to
   resolvers ──► per-chain v3-subgraph  UPSTREAM_GATEWAY_URL (real Uniswap gateway)
   (graph-node, SELF-HOST.md)           └► return its response unchanged
```

The request router lives in `src/server.ts` (`canServeLocally` + `proxyPlugin`). A request executes
locally **only** if it is a query whose every root field is in `LOCAL_QUERY_FIELDS`
(`src/resolvers.ts`); anything else — including any mixed query, mutation, or unknown field — is
proxied. This keeps balances / NFTs / token CMS / v2 / v4 working via Uniswap while HookSwap owns the
pool/token/price surface.

**Directive-aware routing:** root fields excluded by `@skip(if: true)` / `@include(if: false)` are
ignored when deciding local-vs-proxy. This is what lets `PoolPriceHistory` / `PoolVolumeHistory`
(which syntactically carry `v4Pool` + `v3Pool` + `v2Pair`, gated by `$isV4/$isV3/$isV2`) serve their
**v3 branch locally** — the un-served `v4Pool`/`v2Pair` fields are `@include(if: false)` for a v3
pool, so they don't force the whole request to proxy. A *standalone* `V4Pool`/`V2Pair` query (no
`@skip/@include`) still proxies, as intended.

## Resolver coverage

| Operation (interface query) | Root / field | Backing | Status |
|---|---|---|---|
| `TopV3Pools` | `topV3Pools` | subgraph `pools(orderBy: totalValueLockedUSD)` | **implemented** |
| `V3Pool` | `v3Pool` | subgraph `pool(id)` + `bundle` | **implemented** |
| `FeeTierDistribution` | `v3PoolsForTokenPair` | subgraph `pools(where: {token0,token1})` both orders | **implemented** |
| `V3PoolTransactions` | `v3Pool.transactions` | subgraph `swaps`/`mints`/`burns(where: pool)` merged | **implemented** |
| `V3Transactions` | `v3Transactions` | subgraph `swaps`/`mints`/`burns` chain-wide merged | **implemented** |
| `V3TokenTransactions` | `token.v3Transactions` | subgraph swaps/mints/burns `where: token0|token1` | **implemented** |
| `PoolPriceHistory` | `v3Pool.priceHistory` | subgraph `poolHourDatas`/`poolDayDatas` token0/1Price | **implemented** |
| `PoolVolumeHistory` | `v3Pool.historicalVolume` | subgraph `poolHourDatas`/`poolDayDatas` volumeUSD | **implemented** |
| `AllV3Ticks` | `v3Pool.ticks` | subgraph `ticks(where: pool)` | **implemented** |
| `TokenSpotPrice` / `UniswapPrices` | `token` / `tokens` | subgraph `token.derivedETH × bundle.ethPriceUSD` | **implemented** |
| `Tokens` / `Token` / `TokenWeb` | `token` / `tokens` | subgraph `tokens` + day/hour data (via `market`) | **implemented** |
| `TopTokens` | `topTokens` | subgraph `tokens(orderBy: tvl/vol/txCount)` + `bundle` | **implemented** |
| `TokenHistoricalTvls` / `TokenHistoricalVolumes` / `TokenPrice`(ohlc) | `token.market.*` | subgraph `tokenDayDatas`/`tokenHourDatas` | **implemented** |
| `isV3SubgraphStale` | `isV3SubgraphStale` | subgraph `_meta.hasIndexingErrors` | **implemented** |
| `historicalProtocolVolume` / `dailyProtocolTvl` | `historicalProtocolVolume`, … | interface reads these from the **client-explore REST** service, NOT this gateway (`useProtocolStatsQuery`) → serving them here would be dead code | **N/A (REST, not gateway GQL)** |
| `MultiplePortfolioBalances`, `PortfoliosTotalValue` | `portfolios` | — (needs a balance indexer) | **proxied** |
| `NftBalance`, `Nfts`, `NftsTab` | `nftBalances`, `nftAssets`, … | — | **proxied** |
| `TokenProjects`, `TokenProjectDescription/Web` | `tokenProjects`, `token.project.*` (CMS) | — (CMS metadata) | **proxied / null** |
| `TokenProtectionInfo`, `TokenFeeData` | `token.protectionInfo`, `token.feeData` | — | **null (no source)** |
| `Convert`, `searchTokens` | `convert`, `searchTokens` | — | **proxied** |
| `TopV2Pairs`, `V2Pair`, `TopV4Pools`, `V4Pool`, `*V4*` | `topV2Pairs`, `v4Pool`, … | — (no v2 subgraph / no v4 on HookSwap) | **proxied** |

Field resolvers implemented (args-bearing):
- **`V3Pool`**: `cumulativeVolume(duration)` + `totalLiquidityPercentChange24h` (from the pool's inline
  `poolDayData`); `historicalVolume(duration)` / `priceHistory(duration)` (lazy `poolHour/DayDatas`);
  `transactions(first, timestampCursor)`; `ticks(skip, first)`.
- **`Token`**: `market` (builds a lazy `TokenMarket`); `v3Transactions(first, timestampCursor)`.
- **`TokenMarket`**: `price`, `totalValueLocked`, `fullyDilutedValuation` (= `totalSupply/10^dec ×
  price`), and lazily from `tokenHour/DayDatas`: `volume(duration)`, `historicalVolume(duration)`,
  `historicalTvl(duration)`, `priceHistory(duration)`, `ohlc(duration)`, `pricePercentChange(duration)`,
  `priceHighLow(duration, highLow)`. Co-selected fields share one fetch per (granularity, points) via a
  per-`TokenMarket` memo.
- **`TokenProject.markets(currencies)`**: USD **spot price only**. Project-level (cross-chain aggregate)
  `marketCap` / `fullyDilutedValuation` / `volume` / `pricePercentChange24h` / high-low have no single
  v3-subgraph source, so they are `null` here — those metrics ARE served on `token.market` (a single
  token's own snapshots), which is what the TDP charts read.

## TODO — remaining subgraph-serveable gaps

Follow the extension-point steps in [DEPLOY.md](./DEPLOY.md). Until implemented these are safely
proxied upstream / return null.

- [ ] `Query.token` native (address = `null`) ← map to the chain's wrapped-native address, then treat as
      that token. Currently returns `null` for the native asset (so native spot price / TDP is empty).
- [ ] `TokenProject.markets` cross-chain aggregate metrics (`marketCap`, `volume`, `pricePercentChange24h`,
      high-low) — need a cross-chain roll-up the single v3-subgraph can't provide; only `price` is served.
- [ ] `isV3SubgraphStale` block-lag freshness — currently returns `_meta.hasIndexingErrors`; a real
      staleness threshold would compare `_meta.block.number` to the chain head (needs an RPC).
- [ ] `historicalProtocolVolume` / `dailyProtocolTvl` — only wire up if the interface is ever repointed to
      read protocol stats from the gateway GQL instead of the client-explore REST service (it currently
      does NOT; `uniswapDayDatas` is the subgraph source if needed).
- [ ] `topTokens` `MARKET_CAP` ordering falls back to `totalValueLockedUSD` (no circulating-supply source);
      the returned token values are all real — only the *sort key* is substituted for that one enum.
- [ ] No `latestSubgraphBlock` gateway field exists — `web/latestSubgraphBlock.graphql` actually contains
      the `isV3SubgraphStale` query (already served); nothing to add.

## Layout

```
schema.graphql        The gateway SDL served verbatim (COPY of packages/api/.../graphql/schema.graphql).
                      Sync note: re-copy if the interface's schema changes (see DEPLOY.md §sync).
src/
  chains.ts           chainId + gateway `Chain` enum -> per-chain subgraph URL (env SUBGRAPH_URL_<id>)
  subgraphClient.ts   thin fetch-based GraphQL client for a subgraph URL
  translate.ts        subgraph-entity -> gateway-shape mappers (the 3 reference ops + helpers)
  resolvers.ts        Query + field resolvers; LOCAL_QUERY_FIELDS = the subgraph-served allowlist
  server.ts           graphql-yoga host + onParams proxy passthrough + /health
Dockerfile, docker-compose.yml, ecosystem.config.js, .env.example, DEPLOY.md
```

## Run (after `npm install` on a machine with disk)

```bash
cp .env.example .env          # set SUBGRAPH_URL_<id>, UPSTREAM_GATEWAY_URL, CORS_ALLOW_ORIGIN
npm install && npm run build && npm start     # or: docker compose up -d --build
curl -s localhost:4000/health
```

Point the interface at it via `apps/web/.env.local`:
```
AWS_API_ENDPOINT="https://gateway.hookswap.org/v1/graphql"
```
See [DEPLOY.md](./DEPLOY.md) for the full VPS runbook (graph-node wiring, nginx, TLS, pm2/systemd).
