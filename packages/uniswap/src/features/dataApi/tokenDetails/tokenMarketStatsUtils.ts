/**
 * Pure helpers for token market stats (52w clamp, TVL breakdown, stat resolution).
 * Used by useTokenMarketStats and aggregated TDP data.
 */

export interface TokenMarketStats {
  marketCap: number | undefined
  fdv: number | undefined
  volume: number | undefined
  high52w: number | undefined
  low52w: number | undefined
  tvl: number | undefined
  poolsTvl: number | undefined
}

/** Canonical market-stats shape, modeled on data.v2 `TokenMarketStats`. */
export interface MarketStatsData {
  priceUsd?: number
  volumeUsd?: number
  priceHigh52wUsd?: number
  priceLow52wUsd?: number
  marketCapUsd?: number
  fullyDilutedValuationUsd?: number
  totalValueLockedUsd?: number
  poolsTotalValueLockedUsd?: number
}

export function clamp52wWithCurrentPrice(params: {
  currentPrice: number | undefined
  rawHigh: number | undefined
  rawLow: number | undefined
}): { high52w: number | undefined; low52w: number | undefined } {
  const { currentPrice, rawHigh, rawLow } = params
  const high52w = currentPrice !== undefined && rawHigh !== undefined ? Math.max(currentPrice, rawHigh) : rawHigh
  const low52w = currentPrice !== undefined && rawLow !== undefined ? Math.min(currentPrice, rawLow) : rawLow
  return { high52w, low52w }
}

export interface TokenTvlBreakdown {
  tokenTvl: number
  pairedTvl: number
  poolsTvl: number
}

/**
 * Splits pools TVL into the token's side and its pairs' side. Undefined when pools TVL is below token TVL
 * (e.g. an unset proto3 field read as 0), since the paired side would come out negative.
 */
export function getTokenTvlBreakdown(params: {
  tvl: number | undefined
  poolsTvl: number | undefined
}): TokenTvlBreakdown | undefined {
  const { tvl, poolsTvl } = params
  if (tvl === undefined || poolsTvl === undefined || poolsTvl < tvl) {
    return undefined
  }
  return { tokenTvl: tvl, pairedTvl: poolsTvl - tvl, poolsTvl }
}

export function computeTokenMarketStats(params: { market?: MarketStatsData; currentPrice?: number }): TokenMarketStats {
  const { market, currentPrice } = params
  const resolvedPrice = currentPrice ?? market?.priceUsd
  const marketCap = market?.marketCapUsd
  const fdv = market?.fullyDilutedValuationUsd
  const tvl = market?.totalValueLockedUsd
  const poolsTvl = market?.poolsTotalValueLockedUsd
  const volume = market?.volumeUsd
  const rawHigh52w = market?.priceHigh52wUsd
  const rawLow52w = market?.priceLow52wUsd ?? undefined
  const { high52w, low52w } = clamp52wWithCurrentPrice({
    currentPrice: resolvedPrice,
    rawHigh: rawHigh52w,
    rawLow: rawLow52w,
  })
  return { marketCap, fdv, volume, high52w, low52w, tvl, poolsTvl }
}
