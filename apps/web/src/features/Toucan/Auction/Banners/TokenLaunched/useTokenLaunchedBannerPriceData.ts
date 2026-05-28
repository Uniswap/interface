import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

interface TokenLaunchedBannerDataPoint {
  timestamp: number
  value: number
}

// Cap percentage changes to reasonable bounds to handle edge cases
const MAX_PERCENTAGE_CHANGE = 10000 // 10,000% (100x increase)
const MIN_PERCENTAGE_CHANGE = -99.99 // Prevent showing -100% or worse

interface TokenLaunchedBannerData {
  priceSeries: TokenLaunchedBannerDataPoint[]
  currentTickValue: number
  changePercentage: number
}

interface UseTokenLaunchedBannerPriceDataParams {
  tokenAddress?: string
  chainId?: UniverseChainId
  duration?: GraphQLApi.HistoryDuration
  skip?: boolean
}

interface UseTokenLaunchedBannerPriceDataResult {
  data: TokenLaunchedBannerData | undefined
  loading: boolean
  error?: Error
}

/**
 * Hook to fetch real token price data for the Token Launched Banner
 * Uses the same GraphQL query as the main token price chart
 *
 * @param params - Configuration for price data fetching
 * @param params.tokenAddress - The address of the token (or undefined for native token)
 * @param params.chainId - The chain ID where the token exists
 * @param params.duration - Time period for price history (defaults to DAY)
 * @param params.skip - Skip the query (e.g., for failed auctions that don't need price data)
 * @returns Token price data with loading and error states
 */
export function useTokenLaunchedBannerPriceData({
  tokenAddress,
  chainId,
  duration = GraphQLApi.HistoryDuration.Day,
  skip = false,
}: UseTokenLaunchedBannerPriceDataParams): UseTokenLaunchedBannerPriceDataResult {
  const chain = chainId ? toGraphQLChain(chainId) : undefined

  const { data, loading, error } = GraphQLApi.useTokenPriceQuery({
    variables: {
      chain: chain ?? GraphQLApi.Chain.Ethereum,
      address: tokenAddress,
      duration,
      fallback: true, // Use priceHistory (simpler format) instead of OHLC
    },
    skip: skip || !chain || !tokenAddress,
  })

  const bannerData = useMemo((): TokenLaunchedBannerData | undefined => {
    const priceHistory = data?.token?.market?.priceHistory
    const currentPrice = data?.token?.market?.price?.value

    if (!priceHistory || !currentPrice || priceHistory.length === 0) {
      return undefined
    }

    // Filter out undefined entries and transform to banner format
    const priceSeries: TokenLaunchedBannerDataPoint[] = priceHistory
      .filter((entry): entry is GraphQLApi.PriceHistoryFallbackFragment => entry !== undefined)
      .map((entry) => ({
        timestamp: entry.timestamp,
        value: entry.value,
      }))

    if (priceSeries.length === 0) {
      return undefined
    }

    // Calculate percentage change from first price to current price
    const firstPrice = priceSeries[0].value
    const rawChangePercentage =
      firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : currentPrice > 0 ? 100 : 0

    // Cap the percentage to reasonable bounds to prevent extreme values from edge cases
    const changePercentage = Math.min(Math.max(rawChangePercentage, MIN_PERCENTAGE_CHANGE), MAX_PERCENTAGE_CHANGE)

    return {
      priceSeries,
      currentTickValue: currentPrice,
      changePercentage,
    }
  }, [data?.token?.market])

  return {
    data: bannerData,
    loading,
    error: error ? new Error(error.message) : undefined,
  }
}
