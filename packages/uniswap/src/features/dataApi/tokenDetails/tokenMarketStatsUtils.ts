/**
 * Pure helpers for token market stats (52w clamp, stat resolution).
 * Used by useTokenMarketStats and aggregated TDP data.
 */

export interface TokenMarketStats {
  marketCap: number | undefined
  fdv: number | undefined
  volume: number | undefined
  high52w: number | undefined
  low52w: number | undefined
  tvl: number | undefined
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

export function computeTokenMarketStats(params: { market?: MarketStatsData; currentPrice?: number }): TokenMarketStats {
  const { market, currentPrice } = params
  const resolvedPrice = currentPrice ?? market?.priceUsd
  const marketCap = market?.marketCapUsd
  const fdv = market?.fullyDilutedValuationUsd
  const tvl = market?.totalValueLockedUsd
  const volume = market?.volumeUsd
  const rawHigh52w = market?.priceHigh52wUsd
  const rawLow52w = market?.priceLow52wUsd ?? undefined
  const { high52w, low52w } = clamp52wWithCurrentPrice({
    currentPrice: resolvedPrice,
    rawHigh: rawHigh52w,
    rawLow: rawLow52w,
  })
  return { marketCap, fdv, volume, high52w, low52w, tvl }
}
