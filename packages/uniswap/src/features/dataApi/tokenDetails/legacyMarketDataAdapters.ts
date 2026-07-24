/**
 * Adapts the legacy TokenWeb GraphQL market/projectMarket shapes into the canonical
 * MarketStatsData shape (modeled on data.v2.TokenMarketStats), so computeTokenMarketStats
 * has a single input contract regardless of whether the data came from GraphQL or REST.
 * Delete once the GraphQL path is fully retired.
 */
import type { MarketStatsData } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'

interface LegacyMoneyValue {
  value?: number
}

export interface LegacyMarketDataInput {
  price?: LegacyMoneyValue
  volume24H?: LegacyMoneyValue
  priceHigh52W?: LegacyMoneyValue
  priceLow52W?: LegacyMoneyValue
}

export interface LegacyProjectMarketDataInput {
  price?: LegacyMoneyValue
  marketCap?: LegacyMoneyValue
  fullyDilutedValuation?: LegacyMoneyValue
  volume24H?: LegacyMoneyValue
  priceHigh52W?: LegacyMoneyValue
  priceLow52W?: LegacyMoneyValue
}

export function adaptLegacyMarketData(market: LegacyMarketDataInput | undefined): MarketStatsData | undefined {
  if (!market) {
    return undefined
  }
  return {
    priceUsd: market.price?.value,
    volumeUsd: market.volume24H?.value,
    priceHigh52wUsd: market.priceHigh52W?.value,
    priceLow52wUsd: market.priceLow52W?.value,
  }
}

export function adaptLegacyProjectMarketData(
  projectMarket: LegacyProjectMarketDataInput | undefined,
): MarketStatsData | undefined {
  if (!projectMarket) {
    return undefined
  }
  return {
    priceUsd: projectMarket.price?.value,
    volumeUsd: projectMarket.volume24H?.value,
    priceHigh52wUsd: projectMarket.priceHigh52W?.value,
    priceLow52wUsd: projectMarket.priceLow52W?.value,
    marketCapUsd: projectMarket.marketCap?.value,
    fullyDilutedValuationUsd: projectMarket.fullyDilutedValuation?.value,
  }
}
