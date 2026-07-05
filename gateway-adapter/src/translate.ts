/**
 * Subgraph-entity -> gateway-schema-shape mappers.
 *
 * HONEST TRANSLATION ONLY. Every numeric field in the output is derived from a real subgraph value
 * (TVL, volume, reserves, derivedETH x ethPriceUSD). Nothing is invented. Where a gateway field has
 * no subgraph source (logos, safetyLevel, CMS metadata, protection info) we return null — we do NOT
 * synthesize it (the interface degrades gracefully, or that op is proxied upstream instead).
 *
 * Three reference operations are implemented end-to-end (see resolvers.ts for the wiring):
 *   1. TopV3Pools     subgraph `pools`      -> Query.topV3Pools : [V3Pool!]
 *   2. V3Pool         subgraph `pool(id)`   -> Query.v3Pool     : V3Pool
 *   3. TokenSpotPrice / UniswapPrices        subgraph `token.derivedETH x bundle.ethPriceUSD`
 *                                            -> Query.token / Query.tokens : Token(.market.price)
 *
 * Gateway type refs (line numbers approx.) are from ../schema.graphql:
 *   V3Pool (1543), Token (1243), Amount (1461-ish), TokenMarket (1343), TokenProject (1360),
 *   TokenProjectMarket (1377), enum Chain (162), enum ProtocolVersion (285), enum HistoryDuration (232).
 */

import type { GatewayChain } from './chains'

// ------------------------------------------------------------------ subgraph entity shapes
// (subset of v3-subgraph/src/v3/schema.graphql we request; all numeric fields arrive as strings.)

export interface SgToken {
  id: string
  symbol: string
  name: string
  decimals: string
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
  /** last N daily snapshots (desc by date) — used to derive cumulativeVolume(duration). */
  poolDayData?: SgPoolDayDatum[]
}

export interface SgBundle {
  ethPriceUSD: string
}

// ------------------------------------------------------------------ gateway output shapes
// (minimal structural mirrors; graphql-yoga returns only the fields the query selects.)

export interface GwAmount {
  id: string
  value: number
  currency?: string | null
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
  // resolved lazily by field resolvers (see resolvers.ts): project, market.
  project: GwTokenProject
  /** internal: USD spot price (derivedETH x ethPriceUSD). Read by Token.market / project.markets. */
  _priceUSD: number | null
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
  tokens: never[]
  /** internal: carried from the parent token so `markets` can emit a price. */
  _priceUSD: number | null
}

export interface GwV3Pool {
  __typename: 'V3Pool'
  id: string
  protocolVersion: 'V3'
  chain: GatewayChain
  address: string
  feeTier: number
  token0: GwToken
  token1: GwToken
  token0Supply: number
  token1Supply: number
  txCount: number
  totalLiquidity: GwAmount
  totalLiquidityPercentChange24h: null
  /** internal: daily volume snapshots so cumulativeVolume(duration) can be resolved. */
  _poolDayData: SgPoolDayDatum[]
}

// ------------------------------------------------------------------ helpers

function num(v: string | null | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** HistoryDuration enum -> number of trailing days to sum for cumulativeVolume. */
export function durationToDays(duration: string): number {
  switch (duration) {
    case 'HOUR':
    case 'DAY':
      return 1
    case 'WEEK':
      return 7
    case 'MONTH':
      return 30
    case 'YEAR':
      return 365
    default:
      return 1
  }
}

// ------------------------------------------------------------------ token mappers

export function toGwToken(t: SgToken, chain: GatewayChain, priceUSD: number | null): GwToken {
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
    project,
    _priceUSD: priceUSD,
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

/** Build the TokenMarket.price / TokenProjectMarket.price Amount for a token's USD spot price. */
export function toPriceAmount(idScope: string, priceUSD: number | null): GwAmount | null {
  if (priceUSD === null) {
    return null
  }
  return { id: `Amount:price:${idScope}`, value: priceUSD, currency: 'USD' }
}

// ------------------------------------------------------------------ pool mapper (TopV3Pools / V3Pool)

export function toGwV3Pool(p: SgPool, chain: GatewayChain, bundle: SgBundle | null): GwV3Pool {
  // For V3Pool (single pool) the query selects TokenPrice on token0/token1, so compute USD prices.
  // For TopV3Pools the price fields are unselected and simply ignored (bundle may be passed null).
  const price0 = tokenPriceUSD(p.token0, bundle)
  const price1 = tokenPriceUSD(p.token1, bundle)
  return {
    __typename: 'V3Pool',
    id: `V3Pool:${chain}:${p.id.toLowerCase()}`,
    protocolVersion: 'V3',
    chain,
    address: p.id.toLowerCase(),
    feeTier: num(p.feeTier),
    token0: toGwToken(p.token0, chain, price0),
    token1: toGwToken(p.token1, chain, price1),
    token0Supply: num(p.totalValueLockedToken0),
    token1Supply: num(p.totalValueLockedToken1),
    txCount: num(p.txCount),
    totalLiquidity: {
      id: `Amount:tvl:${p.id.toLowerCase()}`,
      value: num(p.totalValueLockedUSD),
      currency: 'USD',
    },
    // The subgraph does not expose a 24h TVL delta directly; leave null rather than fabricate.
    // (Fill from poolDayData[t] vs poolDayData[t-1] tvlUSD if the interface needs it — see README TODO.)
    totalLiquidityPercentChange24h: null,
    _poolDayData: p.poolDayData ?? [],
  }
}

/**
 * cumulativeVolume(duration) for a pool: sum volumeUSD over the trailing N daily snapshots.
 * `dayData` is the pool's poolDayData (desc by date) captured in the initial query — no extra fetch.
 */
export function poolCumulativeVolume(pool: GwV3Pool, duration: string): GwAmount {
  const days = durationToDays(duration)
  const value = pool._poolDayData.slice(0, days).reduce((sum, d) => sum + num(d.volumeUSD), 0)
  return { id: `Amount:vol:${duration}:${pool.address}`, value, currency: 'USD' }
}
