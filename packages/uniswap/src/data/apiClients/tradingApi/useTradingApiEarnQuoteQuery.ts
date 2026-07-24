import { skipToken, type UseQueryResult } from '@tanstack/react-query'
import {
  V1_TRADING_API_PATHS,
  type DiscriminatedQuoteResponse,
  type TradingApi,
  useQueryWithImmediateGarbageCollection,
} from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  usePollingIntervalByChain,
  useQuoteRefetchIntervalForChain,
} from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { tradingApiToUniverseChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface UseTradingApiEarnQuoteQueryParams {
  base: TradingApi.QuoteRequest | undefined
  earnIntent: TradingApi.EarnIntent | undefined
  enabled?: boolean
}

/**
 * Thin typed wrapper around `useQuery` that fetches an earn vault quote from the trading API.
 * Sets `earnIntent` on the QuoteRequest so the backend resolves the chained-actions earn flow.
 */
export function useTradingApiEarnQuoteQuery({
  base,
  earnIntent,
  enabled = true,
}: UseTradingApiEarnQuoteQueryParams): UseQueryResult<DiscriminatedQuoteResponse | null> {
  const params: TradingApi.QuoteRequest | undefined =
    base && earnIntent
      ? {
          ...base,
          earnIntent,
        }
      : undefined

  const chainId = tradingApiToUniverseChainId(base?.tokenInChainId)
  const chainDefaultPollIntervalMs = usePollingIntervalByChain(chainId)
  const refetchInterval = useQuoteRefetchIntervalForChain(chainId)

  return useQueryWithImmediateGarbageCollection({
    queryKey: [ReactQueryCacheKey.TradingApi, V1_TRADING_API_PATHS.quote, 'earn', params],
    queryFn: params
      ? async (): Promise<DiscriminatedQuoteResponse | null> => {
          return TradingApiClient.fetchQuote(params)
        }
      : skipToken,
    enabled: enabled && !!params,
    refetchInterval,
    immediateGcTime: chainDefaultPollIntervalMs + ONE_SECOND_MS * 15,
    retry: 1,
  })
}
