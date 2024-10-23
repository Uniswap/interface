import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import {
  DiscriminatedQuoteResponse,
  TRADING_API_CACHE_KEY,
  WithV4Flag,
  fetchQuote,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'

export function useTradingApiQuoteQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  WithV4Flag<QuoteRequest & { isUSDQuote?: boolean }>,
  DiscriminatedQuoteResponse
>): UseQueryResult<DiscriminatedQuoteResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.quote, params]

  return useQueryWithImmediateGarbageCollection<DiscriminatedQuoteResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof fetchQuote> => {
          const { isUSDQuote, ...fetchParams } = params
          if (fetchParams.tokenInChainId) {
            logSwapQuoteFetch({ chainId: fetchParams.tokenInChainId, isUSDQuote })
          }
          return await fetchQuote(fetchParams)
        }
      : skipToken,
    ...rest,
  })
}
