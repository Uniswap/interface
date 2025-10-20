import { type QueryClient, type QueryKey, skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { is404Error, SharedQueryClient, TradingApi, type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

function getTradingApiIndicativeQuoteQueryKey(params: TradingApi.QuoteRequest | undefined): QueryKey {
  return [
    ReactQueryCacheKey.TradingApi,
    uniswapUrls.tradingApiPaths.quote,
    TradingApi.RoutingPreference.FASTEST,
    params,
  ]
}

/**
 * Indicative quote requests are just requests to the normal quote endpoint,
 * with routingPreference=FASTEST.
 */
export function useTradingApiIndicativeQuoteQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  TradingApi.QuoteRequest,
  TradingApi.QuoteResponse
>): UseQueryResult<TradingApi.QuoteResponse> {
  const queryKey = getTradingApiIndicativeQuoteQueryKey(params)

  return useQuery<TradingApi.QuoteResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof TradingApiClient.fetchQuote> => {
          logSwapQuoteFetch({ chainId: params.tokenInChainId, isQuickRoute: true })
          return await TradingApiClient.fetchQuote({
            ...params,
            routingPreference: TradingApi.RoutingPreference.FASTEST,
          })
        }
      : skipToken,
    ...rest,
  })
}

// To be used outside of React.
// 404 means there's no quote for the given token pair,
// which is something that we might want to safely ignore (and treat as `undefined`) in some cases.
export async function fetchTradingApiIndicativeQuoteIgnoring404({
  queryClient = SharedQueryClient,
  params,
}: {
  queryClient?: QueryClient
  params: TradingApi.QuoteRequest
}): Promise<TradingApi.QuoteResponse | undefined> {
  try {
    return await queryClient.fetchQuery({
      queryKey: getTradingApiIndicativeQuoteQueryKey(params),
      queryFn: async () =>
        TradingApiClient.fetchQuote({
          ...params,
          routingPreference: TradingApi.RoutingPreference.FASTEST,
        }),
    })
  } catch (error) {
    if (is404Error(error)) {
      return undefined
    }
    throw error
  }
}
