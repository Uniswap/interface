# HookSwap data-api — Phase-2 Indexer RPC Contract

> FACTS ONLY. Every claim below is cited to the actual generated proto (`node_modules/@uniswap/client-data-api/dist/data/v1/`) or the actual frontend consumer file:line. Verified 2026-07-10.
>
> Bottom line: the Terminal's Markets/Landing/Analytics stat panels read **stats sub-messages on the existing `listTokens` + `listTopPools` responses** — they are ALREADY wired to the data-api; Phase-2 only has to POPULATE the currently-omitted `stats` fields (option **a**). The Swap chart panel and the Analytics protocol-time-series are on Uniswap's GraphQL / explore-REST backends and need a frontend REPOINT (option **b**) + in some cases a schema/service the data-api doesn't have (option **c**).

---

## 0. Endpoint topology (who serves what — verified)

| Backend | Client pkg | Transport / base | Serves HookSwap chains? | Feeds |
|---|---|---|---|---|
| **DataApiService** (`data.v1`) | `@uniswap/client-data-api` | `dataApiBaseUrlV2` → **data.hookswap.org** (`constants/urls.ts:262-265`; `data/rest/base.ts:54-61`) | YES (our own) | `listTokens`, `listTopPools` (rest = stubs) |
| **ExploreStatsService / ProtocolStatsService** (`uniswap.explore.v1`) | `@uniswap/client-explore` | `uniswapGetTransport` → `apiBaseUrlV2` (Uniswap v2 REST) (`data/rest/base.ts:24,35`; `data/rest/protocolStats.ts:5-18`) | **NO** | Analytics/Landing protocol TVL+Volume time series |
| **Uniswap GraphQL** (uniswap-data-api fragments) | `uniswap/src/data/graphql/uniswap-data-api` | interface gateway GraphQL | **NO** | Swap chart price-history + token market stats |

The dedicated `dataApiBaseUrlV2` override (`urls.ts:258-265`) deliberately points ONLY `DataApiService` at data.hookswap.org; explore-REST + GraphQL stay on Uniswap's backend (which returns nothing for HookSwap chains → honest empty states today).

---

## 1. Proto surface (generated, cited)

### DataApiService methods (`data/v1/api_connect.d.ts`) — 25 unary methods
Real today: **`listTokens`** (`api_connect.d.ts:172`), **`listTopPools`** (`:163`).
Stubs (empty valid response via `methodInfo.O()`, `handlers.ts:247-250`): `getToken`, `getPool`, `getPair`, `listPools`, `getTokenPrices`, `getProtocolStats`, `getPortfolio`/`getPortfolioChart`/`listPortfolios`, `getPosition`/`listPositions`, `getWalletBalances`/`getWalletsBalances`, `getTransaction`/`listTransactions`, `getRewards`, RWA + token-factory + report methods.

### Stats live as SUB-MESSAGES on Token/Pool (the key finding — enrich, don't add methods)

**`data.v1.Token`** (`types_pb.d.ts:533`) carries:
- `stats?: TokenStats` (field 8, `:563-565`)
- `metadata?: TokenMetadata` (field 7, `:559-561`) — `logoUrl`, `safetyLevel`, `spamCode`, feeData…

**`data.v1.MultichainToken`** (`types_pb.d.ts:1068`) — the shape the Markets/Landing UI actually reads — carries:
- `stats?: TokenStats` (field 11, `:1110-1112`)
- `chainTokens: ChainToken[]` (field 12, `:1114`), each `ChainToken` (`:1000`) has `chainId`, `address`, `decimals`, `stats?: ChainTokenStats` (`:1018-1020`)

**`data.v1.TokenStats`** (`types_pb.d.ts:1907`) — ALL optional:
| field | proto type | line |
|---|---|---|
| `fdv` | double | 1909 |
| `volume1h / volume1d / volume7d / volume30d / volume1y` | double | 1913-1931 |
| `price` | float | 1933 |
| `priceChange1h` | float | 1937 |
| `priceChange1d` | float | 1941 |
| `priceHistory1d` | `TimestampedValue[]` | 1945-1947 |

**`data.v1.TimestampedValue`** (`types_pb.d.ts:1886`): `timestamp: bigint` (uint64, field 1), `value: double` (field 2).

**`data.v1.ChainTokenStats`** (`types_pb.d.ts:1033`): only `volume1h/1d/7d/30d/1y` (all optional double). No price/history.

**`data.v1.Pool`** (`types_pb.d.ts:1837`, the `listTopPools` element) carries:
- `chainId, poolId, token0?, token1?, protocolVersion, feeTier, isDynamicFee, hookAddress?` (`:1839-1869`) — all populated today
- `stats?: PoolStats` (field 9, `:1871-1873`) — **omitted today**

**`data.v1.PoolStats`** (`types_pb.d.ts:1800`) — ALL optional:
`tvl` (double, :1802), `volume1d` (double, :1806), `volume30d` (double, :1810), `apr` (float, :1814), `rewardApr` (float, :1818), `totalApr` (float, :1822).

### Separate price/protocol messages (methods, not sub-fields)
- **`GetTokenPricesRequest`** (`api_pb.d.ts:1582`): `tokens: TokenPriceInput[]`, `preferQuotePrices: bool`. **`GetTokenPricesResponse`** (`:1603`): `tokenPrices: TokenPrice[]`. **`TokenPrice`** (`:1553`): `chainId`, `address`, `priceUsd?: double` (`:1563`), `updatedAt?: string`. → USD-only, current price only.
- **`GetProtocolStatsResponse`** (`api_pb.d.ts:1340`): a **SNAPSHOT** — `totalPools`, `total{V2,V3,V4}Pools`, `tvl`, `{v2,v3,v4}Tvl`, `volume1d`, `{v2,v3,v4}Volume1d`, `*Change1d` (`:1342-1412`). **NO time-series array** — cannot feed the Analytics area/bar charts (which need per-day series). Request is empty (`:1327`).
- No token OHLC / price-history METHOD exists. `ChartPeriod` (`api_pb.d.ts:104`, HOUR/DAY/WEEK/MONTH…) is used only by `GetPortfolioChart`. Multi-timeframe token history has **no data-api method** — only `TokenStats.priceHistory1d` (1d) exists.

### Request enums the frontend sends
- `ListTopPoolsRequest` (`api_pb.d.ts:1203`): `chainIds`, `protocolVersions`, `orderBy?: TopPoolsOrderBy`, `ascending?`, `pageSize?`, `pageToken?`.
- `TopPoolsOrderBy` (`api_pb.d.ts:34`): `TVL=1, VOLUME_1D=2, VOLUME_30D=3, APR=4, REWARD_APR=5`. → indexer must support sort by these.
- `ListTokensRequest` (`api_pb.d.ts:1263`): `chainIds`, `orderBy?: TokensOrderBy`, `ascending?`, `pageSize?`, `pageToken?`, `multichain?: bool`. Frontend always sends `multichain: true` (`listTokensService.ts:68`).
- `TokensOrderBy` (`api_pb.d.ts:63`): `FDV=1, VOLUME_1H=2, VOLUME_1D=3, VOLUME_7D=4, VOLUME_30D=5, VOLUME_1Y=6, PRICE_CHANGE_1H=7, PRICE_CHANGE_1D=8`.

---

## 2. Terminal consumers → source map

### Panel A — Swap chart + 24h stats (`apps/web/src/terminal/screens/swap/TerminalChartPanel.tsx`)
| Sub-value | Hook | Backend hit today | Fields read |
|---|---|---|---|
| price series (all timeframes) | `useTokenPriceChartPanel` (`~/hooks/useTokenPriceChartPanel`, `TerminalChartPanel.tsx:385`) | **Uniswap GraphQL** price history | `priceQuery.entries[].value` |
| spot price | last entry of series (`:414`) | Uniswap GraphQL | — |
| 24h % change | `useTokenPriceChange` (`useTokenDetailsData.ts:61-68`) → `useTokenProjectMarketsPartsFragment` | **Uniswap GraphQL** | `project.markets[0].pricePercentChange24h.value` |
| 24h volume | `useTokenMarketStats().volume` (`useTokenDetailsData.ts:82-108`) → `useTokenMarketPartsFragment` + `useTokenProjectMarketsPartsFragment` | **Uniswap GraphQL** | `market.volume24H.value` etc. |
| 24h high/low | derived from series (1D only) (`:427-430`) | Uniswap GraphQL | — |

**Not on the data-api at all.** On HookSwap chains all four render honest "—"/"awaiting pool data feed".

### Panel B — Markets table + top movers (`apps/web/src/terminal/screens/MarketsScreen.tsx`)
| Sub-value | Hook | Backend hit today | Fields read |
|---|---|---|---|
| pool rows (Pair/TVL/Volume/APR/Fees) | `useTopPools` (`:457`) → `useBackendSortedTopPools` (flag `V2EndpointsPools` **forced ON**, `hookswapForcedFlags.ts:23`) → `dataApiQueries.listTopPools` | **data-api** | `pool.stats.tvl / volume1d / volume30d / rewardApr` (`useBackendSortedTopPools.ts:82-96`); Fees24h = `volume1d × feeTier` (`MarketsScreen.tsx:190`) |
| price / 24H % / 7d sparkline / top-movers heatmap / ticker | `useListTokens` (`:462`) → backend path → `dataApiServiceClient.listTokens({multichain:true})` | **data-api** | `token.stats.price`, `token.stats.priceChange1d`, `token.stats.priceHistory1d[].value` (`MarketsScreen.tsx:127-135`; movers `:243`) |

**Already on the data-api.** Empty today because our handler omits `Pool.stats` and returns `multichainTokens: []`.

### Panel B' — Landing (`apps/web/src/terminal/screens/LandingScreen.tsx`)
Same two hooks: `useListTokens` (`:1109`) + `useTopPools` (`:1110-1114`). Ticker (`:245-258`), hero featured chart (`token.stats.priceHistory1d`, `:173-177`), top-markets rows (`:301-323`). PLUS hero TVL/Volume stat cards via `useDailyTVLWithChange`/`use24hProtocolVolume`/`useProtocolStats` (`:1115-1117`) → **explore-REST** (see Panel C).

### Panel C — Analytics (`apps/web/src/terminal/screens/AnalyticsScreen.tsx`)
| Sub-value | Hook | Backend hit today | Fields read |
|---|---|---|---|
| stat cards (Total/v2/v3 TVL, 24h Volume) + big TVL/Volume area chart + volume bars | `useProtocolStats` / `useDailyTVLWithChange` / `use24hProtocolVolume` (`:760-763`) → `useProtocolStatsQuery` (`rest/protocolStats.ts:18`) → `ExploreStatsService.protocolStats` via `uniswapGetTransport` | **Uniswap explore-REST** (`@uniswap/client-explore`) | `dailyProtocolTvl.{v2,v3,v4}[]`, `historicalProtocolVolume.{Month,Year}.{v2,v3,v4}[]` (`TimestampedAmount[]`) |
| 24h Fees, TVL-by-network donut, Top-pools table/list | `useTopPools` (`:766`) | **data-api** listTopPools | `pool.totalLiquidity.value`, `pool.volume1Day.value`, `pool.apr`, `pool.feeTier` |
| top-pools 7d sparkline join | `useListTokens` (`:770`) | **data-api** listTokens | `token.stats.priceHistory1d` |

### Panel D — Locker analytics (`apps/web/src/terminal/screens/LockerScreen.tsx`)
`LockAnalyticsCard` `breakdown` is derived from `useTokenLocks`/`useV3Locks` = **on-chain wagmi reads** (`:409`, `:746`; header comment `:15-16`). **NOT a data-api consumer** — no indexer work required.

---

## 3. Per-panel gap classification

| Panel | Gap type | What's needed |
|---|---|---|
| **B Markets** (pools) | **(a)** | Populate `Pool.stats` (`PoolStats`) in `listTopPools` — `handlers.ts:195-197,226` omit it today. Also honor `TopPoolsOrderBy` sort. |
| **B Markets** (token price/%/spark/movers) | **(a)** | Populate `ListTokensResponse.multichainTokens[]` with `MultichainToken.stats` (`TokenStats`) + `chainTokens[]` — `handlers.ts:164` returns `multichainTokens: []` today. |
| **B' Landing** (pools + token join + ticker + hero chart) | **(a)** | Same two as Markets. |
| **B'/C hero + Analytics protocol series** (TVL/Volume time series) | **(b)+(c)** | (c) proto gap: `DataApiService.getProtocolStats` is a snapshot, not a time series → the frontend uses the SEPARATE `ExploreStatsService.protocolStats` (`@uniswap/client-explore`) for daily series. To serve HookSwap: either (b) repoint `packages/uniswap/src/data/rest/protocolStats.ts:18` + `exploreStats.ts` off `uniswapGetTransport` onto a HookSwap explore-REST endpoint AND stand up an `ExploreStatsService` impl (data-api doesn't implement it), or accept honest-empty protocol charts. Snapshot totals CAN be served via `getProtocolStats` but nothing reads it today. |
| **C Analytics** (donut / top-pools / fees / sparkline) | **(a)** | Same `Pool.stats` + `MultichainToken.stats` as Markets. |
| **A Swap chart** (price series / 24h % / 24h vol / high-low) | **(b)+(c)** | (b) repoint `useTokenPriceChange` + `useTokenMarketStats` (`useTokenDetailsData.ts`) and `useTokenPriceChartPanel` off Uniswap GraphQL onto the data-api. Data-api can supply spot `price`, `priceChange1d`, `volume1d`, and a **1d** `priceHistory1d` (via `getToken`/`listTokens`), but (c) has **no multi-timeframe (1H/1W/1M/1Y) history method** — only 1D. Full chart parity needs a new token-history RPC (mirror `ChartPeriod`) in the proto/service. |
| **D Locker** | none | On-chain; not data-api. |

---

## 4. Priority-ordered implementation list

Native-sourceable-now = computable from on-chain reads in native/token units (indexer metrics: `getSpotPriceNative`, `get24hVolumeTokens`, `get24hPriceChangeNative`, `getReserveTVLTokens`, `getPriceHistory`). **USD-gated** = the field is consumed as a USD figure (UI formats via `convertFiatAmountFormatted(NumberType.Fiat*)`), so it stays unset until a stablecoin USD anchor exists (per no-mock rule).

**P1 — `listTopPools` → populate `Pool.stats` (PoolStats)** — unblocks Markets/Landing/Analytics pool columns.
- Input: `ListTopPoolsRequest{chainIds, protocolVersions, orderBy, ascending, pageSize}`.
- Output fields the UI needs: `stats.tvl`, `stats.volume1d`, `stats.volume30d`, `stats.apr`, `stats.rewardApr` (`useBackendSortedTopPools.ts:82-90`).
- Source / gating:
  - `stats.tvl` ← `getReserveTVLTokens` (token units) → **USD-gated** (displayed as FiatTokenStats).
  - `stats.volume1d / volume30d` ← `get24hVolumeTokens` (needs event indexer) → **USD-gated**.
  - `stats.apr` = f(volume1d, tvl, feeTier); the volume/tvl ratio is unit-free (native-computable) but is only meaningful alongside the USD tvl/volume it's shown with → treat **USD-gated** for honest display. `feeTier` is already real.
  - `stats.rewardApr` ← LP-incentive program (none yet) → leave unset.
  - Honor `orderBy` (`TopPoolsOrderBy`: TVL/VOLUME_1D/VOLUME_30D/APR/REWARD_APR) + `ascending` server-side; `pageToken`/`nextPageToken` for pagination.

**P2 — `listTokens` → populate `multichainTokens[]` with `MultichainToken.stats` (TokenStats) + `chainTokens[]`** — unblocks Markets/Landing price, 24H %, sparkline, top-movers, ticker. (Highest visible impact — everything token-side is empty today because `handlers.ts:164` returns `multichainTokens: []`.)
- Input: `ListTokensRequest{chainIds, orderBy, ascending, pageSize, multichain:true}`.
- Output fields the UI needs (`MarketsScreen.tsx:127-135,243`; `LandingScreen.tsx:173-177,247-255`):
  - `symbol`, `name`, `chainTokens[]{chainId, address, decimals}` — metadata join keys (native-now, on-chain).
  - `stats.priceChange1d` (float, %) ← `get24hPriceChangeNative` → **native-sourceable NOW** (ratio; unit-free). Drives 24H column + movers + ticker % + is the ONE fully-real token metric pre-USD.
  - `stats.priceChange1h` (float, %) ← same → native-now (used by `TokensOrderBy.PRICE_CHANGE_1H`).
  - `stats.priceHistory1d` (`TimestampedValue[]`) ← `getPriceHistory` → **shape native-now** (sparklines only read relative shape, `MarketsScreen.tsx:135`); USD-accurate y-axis labels on Landing hero chart are USD-gated.
  - `stats.price` (float) ← `getSpotPriceNative` → **USD-gated** (formatted FiatTokenPrice).
  - `stats.volume1d / volume7d / volume30d / volume1y / volume1h`, `stats.fdv` ← event indexer / supply×price → **USD-gated** (also power `TokensOrderBy.VOLUME_*`).
- Also honor `orderBy` (`TokensOrderBy`) + pagination; keep the existing flat `tokens[]` for the token selector.

**P3 — (optional, snapshot) `getProtocolStats`** — nothing reads it today, but it is the one native place for protocol totals if a future panel wants a non-time-series summary. Output: `GetProtocolStatsResponse` totals. `tvl/volume*` USD-gated; `totalPools/total{V2,V3}Pools` native-now (pool counts). Low priority — the live Analytics charts need a time series this method does NOT provide.

**P4 — Analytics/Swap time-series (schema/repoint work, defer)**
- Protocol TVL/Volume daily series: requires standing up an `ExploreStatsService` (`uniswap.explore.v1`) equivalent + repointing `rest/protocolStats.ts` & `rest/exploreStats.ts` transports at a HookSwap host. Not part of `DataApiService`. Until then Analytics protocol charts stay honest-empty.
- Swap-chart multi-timeframe token history: needs a NEW token price-history RPC (proto addition, mirror `ChartPeriod` HOUR/DAY/WEEK/MONTH/YEAR) + repoint `useTokenDetailsData.ts` / `useTokenPriceChartPanel` off GraphQL. The existing `TokenStats.priceHistory1d` covers ONLY the 1D timeframe.

---

## 5. Current-handler deltas to close (facts)
- `handlers.ts:164` — `new ListTokensResponse({ tokens, nextPageToken: '', multichainTokens: [] })` → must build `multichainTokens` with `stats`.
- `handlers.ts:81-83` (`toProtoErc20Token`) — omits `stats`/`metadata`.
- `handlers.ts:195-197` (v2) & `:226` (v3) — `Pool` built without `stats`.
- No sort/pagination applied today (`resolveChainIds` only); P1/P2 must honor `orderBy`/`ascending`/`pageSize`/`pageToken`.
