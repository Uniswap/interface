/**
 * Subgraph-entity -> gateway-schema-shape mappers.
 *
 * HONEST TRANSLATION ONLY. Every numeric field in the output is derived from a real subgraph value
 * (TVL, volume, reserves, derivedETH x ethPriceUSD, day/hour snapshots). Nothing is invented. Where a
 * gateway field has no subgraph source (logos, safetyLevel, CMS metadata, protection info, marketCap)
 * we return null — we do NOT synthesize it (the interface degrades gracefully, or that op is proxied
 * upstream instead).
 *
 * Operations wired end-to-end (see resolvers.ts for the Query/field-resolver wiring):
 *   1. TopV3Pools / V3Pool / v3PoolsForTokenPair   subgraph `pools` / `pool(id)`   -> V3Pool
 *   2. TokenSpotPrice / UniswapPrices / TokenWeb / TopTokens / Tokens / Token
 *                                                  subgraph `tokens` (+ day/hour data) -> Token(.market)
 *   3. V3PoolTransactions / V3Transactions / V3TokenTransactions
 *                                                  subgraph `swaps`/`mints`/`burns`  -> PoolTransaction
 *   4. PoolPriceHistory / PoolVolumeHistory        subgraph `poolDayData`/`poolHourData`
 *   5. TokenHistoricalTvls / TokenHistoricalVolumes / TokenPrice(ohlc)
 *                                                  subgraph `tokenDayData`/`tokenHourData`
 *   6. FeeTierDistribution                          subgraph pools grouped by `feeTier`
 *   7. AllV3Ticks                                   subgraph `ticks(where: pool)`
 *
 * Gateway type refs are from ../schema.graphql:
 *   V3Pool (1543), Token (1243), TokenMarket (1343), TokenProject (1360), TokenProjectMarket (1377),
 *   Amount (461), TimestampedAmount (1227), TimestampedOhlc (1234), TimestampedPoolPrice (1513),
 *   V3PoolTick (1520), PoolTransaction (1142), enum Chain (162), enum HistoryDuration (232).
 */

import type { GatewayChain } from './chains'

// ------------------------------------------------------------------ subgraph entity shapes
// (subset of v3-subgraph/src/v3/schema.graphql we request; all numeric fields arrive as strings.)

export interface SgToken {
  id: string
  symbol: string
  name: string
  decimals: string
  totalSupply?: string
  derivedETH?: string
  volumeUSD?: string
  totalValueLockedUSD?: string
}

export interface SgPoolDayDatum {
  date: number
  volumeUSD: string
}

export interface SgPool {
  id: string
  feeTier: string
  liquidity: string
  sqrtPrice: string
  tick?: string | null
  token0: SgToken
  token1: SgToken
  token0Price: string
  token1Price: string
  volumeUSD: string
  txCount: string
  totalValueLockedUSD: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  /** last N daily snapshots (desc by date) — used to derive cumulativeVolume(duration) + 24h TVL delta. */
  poolDayData?: Array<{ date: number; volumeUSD: string; tvlUSD: string }>
}

export interface SgBundle {
  ethPriceUSD: string
}

/** A pool/token day- or hour-snapshot, normalized to a common ascending-timestamp row. */
export interface SeriesRow {
  timestamp: number
  volumeUSD: number
  tvlUSD: number
  priceUSD: number
  open: number
  high: number
  low: number
  close: number
  token0Price: number
  token1Price: number
}

/** raw pool/token day-or-hour snapshot as it arrives from the subgraph (numeric fields = strings). */
export interface SgSnapshot {
  date?: number
  periodStartUnix?: number
  volumeUSD?: string
  tvlUSD?: string
  totalValueLockedUSD?: string
  priceUSD?: string
  token0Price?: string
  token1Price?: string
  open?: string
  high?: string
  low?: string
  close?: string
}

/** A swap / mint / burn event row from the subgraph (shared shape for the fields we select). */
export interface SgPoolEvent {
  id: string
  timestamp: string
  transaction: { id: string }
  token0: SgToken
  token1: SgToken
  origin: string
  amount0: string
  amount1: string
  amountUSD?: string | null
}

export interface SgTick {
  tickIdx: string
  liquidityGross: string
  liquidityNet: string
  price0: string
  price1: string
}

// ------------------------------------------------------------------ gateway output shapes
// (minimal structural mirrors; graphql-yoga returns only the fields the query selects.)

export interface GwAmount {
  id: string
  value: number
  currency?: string | null
}

export interface GwTimestampedAmount {
  __typename: 'TimestampedAmount'
  id: string
  currency: 'USD'
  value: number
  timestamp: number
}

export interface GwTimestampedOhlc {
  __typename: 'TimestampedOhlc'
  id: string
  timestamp: number
  open: GwAmount
  high: GwAmount
  low: GwAmount
  close: GwAmount
}

export interface GwTimestampedPoolPrice {
  __typename: 'TimestampedPoolPrice'
  id: string
  timestamp: number
  token0Price: number
  token1Price: number
}

export interface GwV3PoolTick {
  __typename: 'V3PoolTick'
  id: string
  tickIdx: number
  liquidityGross: string
  liquidityNet: string
  price0: string
  price1: string
}

export interface GwToken {
  __typename: 'Token'
  id: string
  chain: GatewayChain
  address: string
  standard: 'ERC20'
  decimals: number
  name: string
  symbol: string
  isBridged: boolean
  bridgedWithdrawalInfo: null
  feeData: null
  protectionInfo: null
  source: null
  // resolved lazily by field resolvers (see resolvers.ts): project, market, v3Transactions.
  project: GwTokenProject
  /** internal: USD spot price (derivedETH x ethPriceUSD). Read by Token.market / project.markets. */
  _priceUSD: number | null
  /** internal: carried so Token.market / Token.v3Transactions field resolvers can query the subgraph. */
  _tvlUSD: number | null
  _volumeUSDAllTime: number | null
  _totalSupplyRaw: string | null
  _subgraphUrl?: string
}

export interface GwTokenProject {
  __typename: 'TokenProject'
  id: string
  name: string
  isSpam: boolean
  logoUrl: null
  logo: null
  safetyLevel: null
  spamCode: null
  description: null
  homepageUrl: null
  twitterName: null
  tokens: never[]
  /** internal: carried from the parent token so `markets` can emit a price. */
  _priceUSD: number | null
}

/** TokenMarket carries everything its field resolvers need to lazily query day/hour snapshots. */
export interface GwTokenMarket {
  __typename: 'TokenMarket'
  id: string
  token: GwToken
  priceSource: 'SUBGRAPH_V3'
  _priceUSD: number | null
  _tvlUSD: number | null
  _fdvUSD: number | null
  _chain: GatewayChain
  _address: string
  _url?: string
  /** per-market memo so co-selected fields (price+volume+highLow) don't each refetch the same window. */
  _cache: Map<string, Promise<SeriesRow[]>>
}

export interface GwV3Pool {
  __typename: 'V3Pool'
  id: string
  protocolVersion: 'V3'
  chain: GatewayChain
  address: string
  feeTier: number
  createdAtTimestamp: number | null
  token0: GwToken
  token1: GwToken
  token0Supply: number
  token1Supply: number
  txCount: number
  totalLiquidity: GwAmount
  /** internal: daily volume snapshots so cumulativeVolume(duration) / 24h TVL delta can be resolved. */
  _poolDayData: Array<{ date: number; volumeUSD: string; tvlUSD: string }>
  /** internal: carried so priceHistory/historicalVolume/transactions/ticks field resolvers can query. */
  _chain: GatewayChain
  _address: string
  _url?: string
}

export interface GwPoolTransaction {
  __typename: 'PoolTransaction'
  id: string
  chain: GatewayChain
  protocolVersion: 'V3'
  type: 'SWAP' | 'ADD' | 'REMOVE'
  hash: string
  timestamp: number
  usdValue: GwAmount
  account: string
  token0: GwToken
  token0Quantity: string
  token1: GwToken
  token1Quantity: string
}

// ------------------------------------------------------------------ helpers

function num(v: string | number | null | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** HistoryDuration enum -> number of trailing days to sum for pool cumulativeVolume (from poolDayData). */
export function durationToDays(duration: string): number {
  switch (duration) {
    case 'FIVE_MINUTE':
    case 'HOUR':
    case 'DAY':
      return 1
    case 'WEEK':
      return 7
    case 'MONTH':
      return 30
    case 'YEAR':
      return 365
    case 'MAX':
      return 1000
    default:
      return 1
  }
}

/**
 * HistoryDuration -> which snapshot table to read and how many trailing points to request.
 * Sub-day durations use hourly snapshots; week+ uses daily. Each returned point is a REAL snapshot;
 * if the subgraph has fewer, fewer points are returned (honest — never padded).
 */
export function durationToWindow(duration: string): { granularity: 'hour' | 'day'; points: number } {
  switch (duration) {
    case 'FIVE_MINUTE':
    case 'HOUR':
      return { granularity: 'hour', points: 2 }
    case 'DAY':
      return { granularity: 'hour', points: 24 }
    case 'WEEK':
      return { granularity: 'hour', points: 168 }
    case 'MONTH':
      return { granularity: 'day', points: 30 }
    case 'YEAR':
      return { granularity: 'day', points: 365 }
    case 'MAX':
      return { granularity: 'day', points: 1000 }
    default:
      return { granularity: 'day', points: 30 }
  }
}

/** Normalize a raw subgraph day/hour snapshot into a common SeriesRow. */
export function toSeriesRow(s: SgSnapshot): SeriesRow {
  return {
    timestamp: s.periodStartUnix ?? s.date ?? 0,
    volumeUSD: num(s.volumeUSD),
    tvlUSD: num(s.tvlUSD ?? s.totalValueLockedUSD),
    priceUSD: num(s.priceUSD),
    open: num(s.open),
    high: num(s.high),
    low: num(s.low),
    close: num(s.close),
    token0Price: num(s.token0Price),
    token1Price: num(s.token1Price),
  }
}

// ------------------------------------------------------------------ Amount / timestamped builders

export function toAmount(idScope: string, value: number, currency: string | null = 'USD'): GwAmount {
  return { id: `Amount:${idScope}`, value, currency }
}

/** Build the TokenMarket.price / TokenProjectMarket.price Amount for a token's USD spot price. */
export function toPriceAmount(idScope: string, priceUSD: number | null): GwAmount | null {
  if (priceUSD === null) {
    return null
  }
  return { id: `Amount:price:${idScope}`, value: priceUSD, currency: 'USD' }
}

export function toTimestampedAmount(scope: string, timestamp: number, value: number): GwTimestampedAmount {
  return { __typename: 'TimestampedAmount', id: `TimestampedAmount:${scope}:${timestamp}`, currency: 'USD', value, timestamp }
}

export function toTimestampedOhlc(scope: string, r: SeriesRow): GwTimestampedOhlc {
  return {
    __typename: 'TimestampedOhlc',
    id: `TimestampedOhlc:${scope}:${r.timestamp}`,
    timestamp: r.timestamp,
    open: toAmount(`ohlc:o:${scope}:${r.timestamp}`, r.open),
    high: toAmount(`ohlc:h:${scope}:${r.timestamp}`, r.high),
    low: toAmount(`ohlc:l:${scope}:${r.timestamp}`, r.low),
    close: toAmount(`ohlc:c:${scope}:${r.timestamp}`, r.close),
  }
}

// ------------------------------------------------------------------ token mappers

/**
 * Map a subgraph Token to the gateway Token shape.
 * `url` is the chain's subgraph URL, carried so Token.market / Token.v3Transactions field resolvers can
 * lazily query day/hour snapshots + events. Pass undefined for tokens embedded in a transaction/pool
 * where no further market lookups are expected.
 */
export function toGwToken(t: SgToken, chain: GatewayChain, priceUSD: number | null, url?: string): GwToken {
  const address = t.id.toLowerCase()
  const project: GwTokenProject = {
    __typename: 'TokenProject',
    id: `TokenProject:${chain}:${address}`,
    name: t.name,
    isSpam: false,
    logoUrl: null,
    logo: null,
    safetyLevel: null,
    spamCode: null,
    description: null,
    homepageUrl: null,
    twitterName: null,
    tokens: [],
    _priceUSD: priceUSD,
  }
  return {
    __typename: 'Token',
    id: `Token:${chain}:${address}`,
    chain,
    address,
    standard: 'ERC20',
    decimals: num(t.decimals),
    name: t.name,
    symbol: t.symbol,
    isBridged: false,
    bridgedWithdrawalInfo: null,
    feeData: null,
    protectionInfo: null,
    source: null,
    project,
    _priceUSD: priceUSD,
    _tvlUSD: t.totalValueLockedUSD !== undefined ? num(t.totalValueLockedUSD) : null,
    _volumeUSDAllTime: t.volumeUSD !== undefined ? num(t.volumeUSD) : null,
    _totalSupplyRaw: t.totalSupply ?? null,
    _subgraphUrl: url,
  }
}

/** derivedETH x ethPriceUSD -> USD spot price, or null if either is missing. */
export function tokenPriceUSD(t: SgToken, bundle: SgBundle | null): number | null {
  if (!t.derivedETH || !bundle) {
    return null
  }
  const price = num(t.derivedETH) * num(bundle.ethPriceUSD)
  return Number.isFinite(price) ? price : null
}

/** Build the lazy TokenMarket for a token (fullyDilutedValuation = totalSupply/10^decimals x price). */
export function buildTokenMarket(token: GwToken): GwTokenMarket {
  let fdv: number | null = null
  if (token._totalSupplyRaw !== null && token._priceUSD !== null) {
    const supply = num(token._totalSupplyRaw) / 10 ** token.decimals
    const v = supply * token._priceUSD
    fdv = Number.isFinite(v) ? v : null
  }
  return {
    __typename: 'TokenMarket',
    id: `TokenMarket:${token.chain}:${token.address}`,
    token,
    priceSource: 'SUBGRAPH_V3',
    _priceUSD: token._priceUSD,
    _tvlUSD: token._tvlUSD,
    _fdvUSD: fdv,
    _chain: token.chain,
    _address: token.address,
    _url: token._subgraphUrl,
    _cache: new Map(),
  }
}

// ------------------------------------------------------------------ series reducers (shared)

/** Sum volumeUSD across a series (cumulative volume over the window). */
export function sumVolume(rows: SeriesRow[]): number {
  return rows.reduce((s, r) => s + r.volumeUSD, 0)
}

/** % change from the earliest open to the latest close of a price series (0 if no baseline). */
export function pricePercentChange(rows: SeriesRow[]): number {
  if (rows.length === 0) {
    return 0
  }
  const first = rows[0].open || rows[0].priceUSD
  const last = rows[rows.length - 1].close || rows[rows.length - 1].priceUSD
  if (!first) {
    return 0
  }
  return ((last - first) / first) * 100
}

/** Highest high (HIGH) or lowest low (LOW) across a price series, or null if empty. */
export function priceHighLow(rows: SeriesRow[], highLow: 'HIGH' | 'LOW'): number | null {
  if (rows.length === 0) {
    return null
  }
  if (highLow === 'HIGH') {
    return rows.reduce((m, r) => Math.max(m, r.high || r.priceUSD), -Infinity)
  }
  return rows.reduce((m, r) => Math.min(m, r.low || r.priceUSD), Infinity)
}

// ------------------------------------------------------------------ pool mapper (TopV3Pools / V3Pool)

export function toGwV3Pool(p: SgPool, chain: GatewayChain, bundle: SgBundle | null, url?: string): GwV3Pool {
  // For V3Pool (single pool) the query selects TokenPrice on token0/token1, so compute USD prices.
  // For TopV3Pools the price fields are unselected and simply ignored (bundle may be passed null).
  const price0 = tokenPriceUSD(p.token0, bundle)
  const price1 = tokenPriceUSD(p.token1, bundle)
  const address = p.id.toLowerCase()
  return {
    __typename: 'V3Pool',
    id: `V3Pool:${chain}:${address}`,
    protocolVersion: 'V3',
    chain,
    address,
    feeTier: num(p.feeTier),
    createdAtTimestamp: null,
    token0: toGwToken(p.token0, chain, price0, url),
    token1: toGwToken(p.token1, chain, price1, url),
    token0Supply: num(p.totalValueLockedToken0),
    token1Supply: num(p.totalValueLockedToken1),
    txCount: num(p.txCount),
    totalLiquidity: toAmount(`tvl:${address}`, num(p.totalValueLockedUSD)),
    _poolDayData: p.poolDayData ?? [],
    _chain: chain,
    _address: address,
    _url: url,
  }
}

/**
 * cumulativeVolume(duration) for a pool: sum volumeUSD over the trailing N daily snapshots.
 * `_poolDayData` is the pool's poolDayData (desc by date) captured in the initial query — no extra fetch.
 */
export function poolCumulativeVolume(pool: GwV3Pool, duration: string): GwAmount {
  const days = durationToDays(duration)
  const value = pool._poolDayData.slice(0, days).reduce((sum, d) => sum + num(d.volumeUSD), 0)
  return toAmount(`vol:${duration}:${pool.address}`, value)
}

/**
 * totalLiquidityPercentChange24h: (tvl[today] - tvl[yesterday]) / tvl[yesterday] x 100, from the two most
 * recent daily snapshots. Returns null if fewer than 2 snapshots or no baseline (never fabricated).
 */
export function poolTvlPercentChange24h(pool: GwV3Pool): GwAmount | null {
  const dd = pool._poolDayData
  if (dd.length < 2) {
    return null
  }
  const today = num(dd[0].tvlUSD)
  const prev = num(dd[1].tvlUSD)
  if (!prev) {
    return null
  }
  return toAmount(`tvlchg24h:${pool.address}`, ((today - prev) / prev) * 100, null)
}

// ------------------------------------------------------------------ transaction mapper

/** Map a subgraph swap/mint/burn to the gateway PoolTransaction. Preserves signed amounts (the interface
 * infers swap direction from the sign of token0Quantity — see usePoolTransactions.ts). */
export function toGwPoolTransaction(
  e: SgPoolEvent,
  type: 'SWAP' | 'ADD' | 'REMOVE',
  chain: GatewayChain,
): GwPoolTransaction {
  return {
    __typename: 'PoolTransaction',
    id: `PoolTransaction:${chain}:${e.id}`,
    chain,
    protocolVersion: 'V3',
    type,
    hash: e.transaction.id,
    timestamp: num(e.timestamp),
    usdValue: toAmount(`tx:${e.id}`, num(e.amountUSD)),
    account: e.origin,
    token0: toGwToken(e.token0, chain, null),
    token0Quantity: e.amount0,
    token1: toGwToken(e.token1, chain, null),
    token1Quantity: e.amount1,
  }
}

// ------------------------------------------------------------------ tick mapper (AllV3Ticks)

export function toGwV3PoolTick(t: SgTick, poolAddress: string): GwV3PoolTick {
  return {
    __typename: 'V3PoolTick',
    id: `V3PoolTick:${poolAddress}:${t.tickIdx}`,
    tickIdx: num(t.tickIdx),
    liquidityGross: t.liquidityGross,
    liquidityNet: t.liquidityNet,
    price0: t.price0,
    price1: t.price1,
  }
}
