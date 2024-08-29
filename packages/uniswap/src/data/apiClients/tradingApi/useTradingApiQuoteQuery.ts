import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import {
  DiscriminatedQuoteResponse,
  TRADING_API_CACHE_KEY,
  fetchQuote,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'

export function useTradingApiQuoteQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  QuoteRequest,
  DiscriminatedQuoteResponse
>): UseQueryResult<DiscriminatedQuoteResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.quote, params]

  return useQueryWithImmediateGarbageCollection<DiscriminatedQuoteResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchQuote> => await fetchQuote(params) : skipToken,
    ...rest,
  })
}
