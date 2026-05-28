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
import type {
  MarketDataInput,
  ProjectMarketDataInput,
  TokenMarketStats,
} from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { computeTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import type { CurrencyId } from 'uniswap/src/types/currency'

export type { TokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'

/**
 * Returns the current spot price for a token
 *
 * IMPORTANT: For multi-chain tokens (e.g., USDC on Ethereum vs Polygon), this returns
 * the per-chain price, NOT the aggregated project price. This ensures each chain's
 * token page shows the correct price for that specific chain.
 *
 * Prefers per-chain subgraph data, falls back to aggregated CoinGecko data
 */
export function useTokenSpotPrice(currencyId: CurrencyId | undefined): number | undefined {
  const id = currencyId ?? ''
  const tokenMarket = useTokenMarketPartsFragment({ currencyId: id }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId: id }).data.project?.markets

  return useMemo(() => {
    return tokenMarket?.price?.value ?? projectMarkets?.[0]?.price?.value
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [tokenMarket?.price?.value, projectMarkets?.[0]?.price?.value])
}

/**
 * Returns the 24hr price change percentage for a token
 */
export function useTokenPriceChange(currencyId: CurrencyId): number | undefined {
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  return useMemo(() => {
    return projectMarkets?.[0]?.pricePercentChange24h?.value
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [projectMarkets?.[0]?.pricePercentChange24h?.value])
}

/** Optional aggregated market + project data (e.g. from TDP TokenWebQuery when multichain). When provided, stats are computed from this instead of fragment queries. */
export interface TokenMarketStatsAggregatedInput {
  market?: MarketDataInput
  project?: { markets?: Array<ProjectMarketDataInput | undefined> }
}

export interface UseTokenMarketStatsParams {
  currentPriceOverride?: number
  aggregatedData?: TokenMarketStatsAggregatedInput | null
}

export function useTokenMarketStats(currencyId: CurrencyId, params?: UseTokenMarketStatsParams): TokenMarketStats {
  const { currentPriceOverride, aggregatedData } = params ?? {}
  const tokenMarket = useTokenMarketPartsFragment({ currencyId }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId }).data.project?.markets

  return useMemo(() => {
    const hasAggregated =
      aggregatedData &&
      (aggregatedData.market?.volume24H?.value != null ||
        aggregatedData.market?.priceHigh52W?.value != null ||
        (aggregatedData.project?.markets?.length ?? 0) > 0)
    if (hasAggregated) {
      return computeTokenMarketStats({
        market: aggregatedData.market,
        projectMarket: aggregatedData.project?.markets?.[0],
        currentPrice: currentPriceOverride,
      })
    }
    return computeTokenMarketStats({
      market: tokenMarket,
      projectMarket: projectMarkets?.[0],
      currentPrice: currentPriceOverride,
    })
  }, [aggregatedData, currentPriceOverride, projectMarkets, tokenMarket])
}
