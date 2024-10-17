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
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useTradingApiQuoteQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  WithV4Flag<QuoteRequest>,
  DiscriminatedQuoteResponse
>): UseQueryResult<DiscriminatedQuoteResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.quote, params]
  const v4Enabled = useFeatureFlag(FeatureFlags.V4Swap)

  return useQueryWithImmediateGarbageCollection<DiscriminatedQuoteResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchQuote> => await fetchQuote({ ...params, v4Enabled }) : skipToken,
    ...rest,
  })
}
