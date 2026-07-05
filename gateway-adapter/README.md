# HookSwap gateway-schema adapter

A small, self-contained **graphql-yoga** service that serves the **exact Uniswap gateway GraphQL
schema** the HookSwap interface calls (`AWS_API_ENDPOINT`), backed by HookSwap's **own** self-hosted
v3-subgraph for pool/token/price data, and **proxying** everything a subgraph can't serve to the real
Uniswap gateway. It exists because Uniswap's hosted gateway (`beta.gateway.uniswap.org`) only serves
Uniswap chains — the HookSwap interface needs its **own** gateway for chains
4326 / 4663 / 57073 / 196 / 999 / 4217 / 11155111.

> **Status: skeleton.** The served SDL (copied verbatim from the interface), the hybrid
> local-vs-proxy request router, the per-chain subgraph mapping, and **three reference resolvers**
> (plus a bonus `_meta` probe) are real and typed. The remaining subgraph-serveable operations are
> marked TODO below. **No data is ever fabricated** — an unimplemented op is proxied upstream, or (if
> `UPSTREAM_GATEWAY_URL` is unset) returns a GraphQL error; a missing subgraph value returns `null`.
>
> Dependencies are **not installed** in this checkout (disk-constrained). `npm install` happens on
> the VPS at deploy time — see [DEPLOY.md](./DEPLOY.md).

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

## Resolver coverage

| Operation (interface query) | Root field | Backing | Status |
|---|---|---|---|
| `TopV3Pools` | `topV3Pools` | subgraph `pools(orderBy: totalValueLockedUSD)` | **implemented** |
| `V3Pool` | `v3Pool` | subgraph `pool(id)` + `bundle` | **implemented** |
| `TokenSpotPrice` | `token` | subgraph `token.derivedETH × bundle.ethPriceUSD` | **implemented** |
| `UniswapPrices` | `tokens` | subgraph `tokens(id_in) × bundle` | **implemented** |
| `isV3SubgraphStale` | `isV3SubgraphStale` | subgraph `_meta.hasIndexingErrors` | **implemented (bonus)** |
| `MultiplePortfolioBalances`, `PortfoliosTotalValue` | `portfolios` | — (needs a balance indexer) | **proxied** |
| `NftBalance`, `Nfts`, `NftsTab` | `nftBalances`, `nftAssets`, … | — | **proxied** |
| `TokenProjects`, `TokenProjectDescription/Web/Markets` | `tokenProjects` | — (CMS) | **proxied** |
| `TokenProtectionInfo`, `TokenFeeData` | `token.protectionInfo`, `token.feeData` | — | **proxied** |
| `Convert`, `RWAIssuerTokens`, `searchTokens` | `convert`, … | — | **proxied** |
| `TopV2Pairs`, `V2Pair`, `TopV4Pools`, `V4Pool`, `*V4*` | `topV2Pairs`, `v4Pool`, … | — (no v4/hooks on HookSwap) | **proxied** |

Field resolvers implemented (args-bearing): `V3Pool.cumulativeVolume(duration)` (from the pool's
`poolDayData`), `Token.market(currency)` and `TokenProject.markets(currencies)` (USD spot price).

## TODO — remaining subgraph-serveable operations

These CAN be served from the v3-subgraph (entities exist) but need `translate.ts` mappers +
`resolvers.ts` wiring + adding the field to `LOCAL_QUERY_FIELDS`. Follow the extension-point steps in
[DEPLOY.md](./DEPLOY.md). Until implemented they are safely proxied upstream.

- [ ] `V3PoolTransactions` / `v3Transactions` ← subgraph `swaps`/`mints`/`burns(where: pool)`
- [ ] `V3TokenTransactions` / `V3Transactions` ← subgraph swaps/mints/burns by token
- [ ] `TopTokens` / `Tokens` / `Token` (full metadata) ← subgraph `tokens(orderBy: totalValueLockedUSD)`
- [ ] `PoolPriceHistory` / `PoolVolumeHistory` ← subgraph `poolDayDatas`/`poolHourDatas` (`priceHistory`/`historicalVolume`)
- [ ] `TokenHistoricalTvls` / `TokenHistoricalVolumes` / `tokenCharts` ← subgraph `tokenDayDatas`/`tokenHourDatas`
- [ ] `FeeTierDistribution` ← subgraph pools grouped by `feeTier`
- [ ] `AllV3Ticks` ← subgraph `ticks(where: pool)`
- [ ] `HomeScreenTokens` / landing `TopTokens` ← subgraph `tokens`
- [ ] `v3PoolsForTokenPair` ← subgraph `pools(where: {token0, token1})`
- [ ] `latestSubgraphBlock` ← subgraph `_meta.block.number`
- [ ] `historicalProtocolVolume` / `dailyProtocolTvl` ← subgraph `uniswapDayDatas`
- [ ] `V3Pool.totalLiquidityPercentChange24h` ← derive from `poolDayData[t]` vs `[t-1]` `tvlUSD`
- [ ] `Query.token` native (address = null) ← map to the chain's wrapped-native address

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
