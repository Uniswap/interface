import { QueryClient, QueryKey, UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { is404Error } from 'uniswap/src/data/apiClients/FetchError'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { fetchQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { QuoteRequest, QuoteResponse, RoutingPreference } from 'uniswap/src/data/tradingApi/__generated__'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

function getTradingApiIndicativeQuoteQueryKey(params: QuoteRequest | undefined): QueryKey {
  return [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.quote, RoutingPreference.FASTEST, params]
}

/**
 * Indicative quote requests are just requests to the normal quote endpoint,
 * with routingPreference=FASTEST.
 */
export function useTradingApiIndicativeQuoteQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<QuoteRequest, QuoteResponse>): UseQueryResult<QuoteResponse> {
  const queryKey = getTradingApiIndicativeQuoteQueryKey(params)

  return useQuery<QuoteResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof fetchQuote> => {
          logSwapQuoteFetch({ chainId: params.tokenInChainId, isQuickRoute: true })
          return await fetchQuote({
            ...params,
            routingPreference: RoutingPreference.FASTEST,
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
  params: QuoteRequest
}): Promise<QuoteResponse | undefined> {
  try {
    return await queryClient.fetchQuery({
      queryKey: getTradingApiIndicativeQuoteQueryKey(params),
      queryFn: async () =>
        fetchQuote({
          ...params,
          routingPreference: RoutingPreference.FASTEST,
        }),
    })
  } catch (error) {
    if (is404Error(error)) {
      return undefined
    }
    throw error
  }
}
