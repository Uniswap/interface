/**
 * Shared hooks for token detail data across mobile and web
 *
 * Data source preference:
 * - CoinGecko (TokenProjectMarket) first for: price, marketCap, FDV, 52w high/low, 24hr price change
 * - Subgraph (TokenMarket) fallback and exclusive for: volume
 */

import { useMemo } from 'react'
import {
  useTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import type { CurrencyId } from 'uniswap/src/types/currency'

/**
 * Returns the current spot price for a token
 *
 * IMPORTANT: For multi-chain tokens (e.g., USDC on Ethereum vs Polygon), this returns
 * the per-chain price, NOT the aggregated project price. This ensures each chain's
 * token page shows the correct price for that specific chain.
 *
 * Prefers per-chain subgraph data, falls back to aggregated CoinGecko data
 */
export function useTokenSpotPrice(currencyId: CurrencyId): number | undefined {
  const tokenMarket = useTokenMarketPartsFragment({ currencyId }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  return useMemo(() => {
    return tokenMarket?.price?.value ?? projectMarkets?.[0]?.price?.value
  }, [tokenMarket?.price?.value, projectMarkets?.[0]?.price?.value])
}

/**
 * Returns the 24hr price change percentage for a token
 */
export function useTokenPriceChange(currencyId: CurrencyId): number | undefined {
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  return useMemo(() => {
    return projectMarkets?.[0]?.pricePercentChange24h?.value
  }, [projectMarkets?.[0]?.pricePercentChange24h?.value])
}

/**
 * Returns market statistics for a token with defensive fallback logic
 *
 * Each stat will automatically fallback to the alternate source if available,
 * ensuring the UI always displays data when any source has it.
 */
export interface TokenMarketStats {
  marketCap: number | undefined
  fdv: number | undefined
  volume: number | undefined
  high52w: number | undefined
  low52w: number | undefined
}

export function useTokenMarketStats(currencyId: CurrencyId): TokenMarketStats {
  const tokenMarket = useTokenMarketPartsFragment({ currencyId }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  return useMemo(() => {
    const currentPrice = projectMarkets?.[0]?.price?.value ?? tokenMarket?.price?.value
    const marketCap = projectMarkets?.[0]?.marketCap?.value ?? undefined
    const fdv = projectMarkets?.[0]?.fullyDilutedValuation?.value ?? undefined
    const volume = tokenMarket?.volume?.value ?? undefined
    const rawHigh52w = projectMarkets?.[0]?.priceHigh52W?.value ?? tokenMarket?.priceHigh52W?.value ?? undefined
    const rawLow52w = projectMarkets?.[0]?.priceLow52W?.value ?? tokenMarket?.priceLow52W?.value ?? undefined

    // Adjust 52w bounds if current price exceeds them
    const high52w =
      currentPrice !== undefined && rawHigh52w !== undefined ? Math.max(currentPrice, rawHigh52w) : rawHigh52w
    const low52w = currentPrice !== undefined && rawLow52w !== undefined ? Math.min(currentPrice, rawLow52w) : rawLow52w

    return {
      marketCap,
      fdv,
      volume,
      high52w,
      low52w,
    }
  }, [
    projectMarkets?.[0]?.price?.value,
    projectMarkets?.[0]?.marketCap?.value,
    projectMarkets?.[0]?.fullyDilutedValuation?.value,
    projectMarkets?.[0]?.priceHigh52W?.value,
    projectMarkets?.[0]?.priceLow52W?.value,
    tokenMarket?.volume?.value,
    tokenMarket?.price?.value,
    tokenMarket?.priceHigh52W?.value,
    tokenMarket?.priceLow52W?.value,
  ])
}
