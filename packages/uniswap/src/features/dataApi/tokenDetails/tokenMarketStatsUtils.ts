/**
 * Pure helpers for token market stats (52w clamp, stat resolution).
 * Used by useTokenMarketStats and aggregated TDP data.
 */

export interface TokenMarketStats {
  marketCap: number | undefined
  fdv: number | undefined
  volume: number | undefined
  // 'project' = CoinGecko, aggregated across networks; 'market' = Uniswap fallback.
  volumeSource: 'project' | 'market' | undefined
  high52w: number | undefined
  low52w: number | undefined
  tvl: number | undefined
}

/** Canonical market-stats shape, adapted from either V2 REST or legacy GraphQL data (see legacyMarketDataAdapters.ts). */
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

// oxlint-disable-next-line complexity
export function computeTokenMarketStats(params: {
  market?: MarketStatsData
  projectMarket?: MarketStatsData
  currentPrice?: number
  preferProjectMarketData?: boolean
}): TokenMarketStats {
  const { market, projectMarket, currentPrice, preferProjectMarketData } = params
  const marketVolume = market?.volumeUsd ?? undefined
  const projectMarketVolume = projectMarket?.volumeUsd ?? undefined
  const resolvedPrice = preferProjectMarketData
    ? (projectMarket?.priceUsd ?? currentPrice ?? market?.priceUsd ?? undefined)
    : (currentPrice ?? projectMarket?.priceUsd ?? market?.priceUsd ?? undefined)
  const marketCap = projectMarket?.marketCapUsd ?? market?.marketCapUsd ?? undefined
  const fdv = projectMarket?.fullyDilutedValuationUsd ?? market?.fullyDilutedValuationUsd ?? undefined
  const tvl = market?.totalValueLockedUsd ?? undefined
  const volume = preferProjectMarketData ? (projectMarketVolume ?? marketVolume) : marketVolume
  let volumeSource: TokenMarketStats['volumeSource']
  if (preferProjectMarketData && projectMarketVolume !== undefined) {
    volumeSource = 'project'
  } else if (volume !== undefined) {
    volumeSource = 'market'
  } else {
    volumeSource = undefined
  }
  const rawHigh52w = projectMarket?.priceHigh52wUsd ?? market?.priceHigh52wUsd ?? undefined
  const rawLow52w = projectMarket?.priceLow52wUsd ?? market?.priceLow52wUsd ?? undefined
  const { high52w, low52w } = clamp52wWithCurrentPrice({
    currentPrice: resolvedPrice,
    rawHigh: rawHigh52w,
    rawLow: rawLow52w,
  })
  return { marketCap, fdv, volume, volumeSource, high52w, low52w, tvl }
}
