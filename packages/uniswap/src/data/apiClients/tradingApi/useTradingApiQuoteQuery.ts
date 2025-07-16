import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  DiscriminatedQuoteResponse,
  TRADING_API_CACHE_KEY,
  WithV4Flag,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingAPIReplicaResult, TradingApiReplicaRequests } from './useTradingApiReplica'

export function useTradingApiQuoteQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  WithV4Flag<QuoteRequest & { isUSDQuote?: boolean }>,
  DiscriminatedQuoteResponse
>): TradingAPIReplicaResult<DiscriminatedQuoteResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.quote, params]

  return useTradingApiReplica({
    request: TradingApiReplicaRequests.QUOTE,
    params,
  })
}
