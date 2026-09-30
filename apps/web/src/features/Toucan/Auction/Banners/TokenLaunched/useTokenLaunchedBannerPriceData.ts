import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTokenPriceHistoryRest } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

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
  duration?: HistoryDuration
  skip?: boolean
}

interface UseTokenLaunchedBannerPriceDataResult {
  data: TokenLaunchedBannerData | undefined
  loading: boolean
  error?: Error
  // True when the launched token has a live market price, i.e. a pool with liquidity is actually
  // trading. Independent of `data`, which additionally requires price history. Used to gate the
  // "Trade now" CTA so a graduated auction with no pool isn't advertised as tradeable.
  hasMarketPrice: boolean
}

function selectSpotUsd(data: PlainMessage<GetTokenResponse> | undefined): number | undefined {
  return data?.token?.price?.spotUsd
}

/**
 * Hook to fetch real token price data for the Token Launched Banner
 * Uses the same V2 price-history and spot-price sources as the main token price chart
 *
 * @param params - Configuration for price data fetching
 * @param params.tokenAddress - The address of the token
 * @param params.chainId - The chain ID where the token exists
 * @param params.duration - Time period for price history (defaults to DAY)
 * @param params.skip - Skip the query (e.g., for failed auctions that don't need price data)
 * @returns Token price data with loading and error states
 */
export function useTokenLaunchedBannerPriceData({
  tokenAddress,
  chainId,
  duration = HistoryDuration.Day,
  skip = false,
}: UseTokenLaunchedBannerPriceDataParams): UseTokenLaunchedBannerPriceDataResult {
  const currencyId = !skip && chainId && tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined

  const {
    entries: priceHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useTokenPriceHistoryRest(currencyId, { duration })

  const restParams = useMemo(() => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined), [currencyId])
  const {
    data: currentPrice,
    isLoading: priceLoading,
    error: priceError,
  } = useQuery(getGetTokenQueryOptions({ params: restParams, select: selectSpotUsd, enabled: !!restParams }))

  const bannerData = useMemo((): TokenLaunchedBannerData | undefined => {
    if (!currentPrice || priceHistory.length === 0) {
      return undefined
    }

    const priceSeries: TokenLaunchedBannerDataPoint[] = priceHistory.map((entry) => ({
      timestamp: entry.timestamp,
      value: entry.value,
    }))

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
  }, [currentPrice, priceHistory])

  return {
    data: bannerData,
    loading: historyLoading || priceLoading,
    error: priceError ?? historyError ?? undefined,
    hasMarketPrice: Boolean(currentPrice),
  }
}
