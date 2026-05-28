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
}

export interface MarketDataInput {
  price?: { value?: number }
  volume?: { value?: number }
  volume24H?: { value?: number }
  priceHigh52W?: { value?: number }
  priceLow52W?: { value?: number }
}

export interface ProjectMarketDataInput {
  price?: { value?: number }
  marketCap?: { value?: number }
  fullyDilutedValuation?: { value?: number }
  priceHigh52W?: { value?: number }
  priceLow52W?: { value?: number }
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
  market?: MarketDataInput
  projectMarket?: ProjectMarketDataInput
  currentPrice?: number
}): TokenMarketStats {
  const { market, projectMarket, currentPrice } = params
  const resolvedPrice = currentPrice ?? projectMarket?.price?.value ?? market?.price?.value ?? undefined
  const marketCap = projectMarket?.marketCap?.value ?? undefined
  const fdv = projectMarket?.fullyDilutedValuation?.value ?? undefined
  const volume = market?.volume24H?.value ?? market?.volume?.value ?? undefined
  const rawHigh52w = projectMarket?.priceHigh52W?.value ?? market?.priceHigh52W?.value ?? undefined
  const rawLow52w = projectMarket?.priceLow52W?.value ?? market?.priceLow52W?.value ?? undefined
  const { high52w, low52w } = clamp52wWithCurrentPrice({
    currentPrice: resolvedPrice,
    rawHigh: rawHigh52w,
    rawLow: rawLow52w,
  })
  return { marketCap, fdv, volume, high52w, low52w }
}
