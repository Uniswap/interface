import { QueryClient, UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { is404Error } from 'uniswap/src/data/apiClients/FetchError'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { TRADING_API_CACHE_KEY, fetchIndicativeQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { IndicativeQuoteRequest, IndicativeQuoteResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'

function getTradingApiIndicativeQuoteQueryKey(
  params: IndicativeQuoteRequest | undefined,
): Array<string | IndicativeQuoteRequest | undefined> {
  return [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.indicativeQuote, params]
}

export function useTradingApiIndicativeQuoteQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  IndicativeQuoteRequest,
  IndicativeQuoteResponse
>): UseQueryResult<IndicativeQuoteResponse> {
  const queryKey = getTradingApiIndicativeQuoteQueryKey(params)

  return useQuery<IndicativeQuoteResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof fetchIndicativeQuote> => {
          if (params.tokenInChainId) {
            logSwapQuoteFetch({ chainId: params.tokenInChainId, isQuickRoute: true })
          }
          return await fetchIndicativeQuote(params)
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
  params: IndicativeQuoteRequest
}): Promise<IndicativeQuoteResponse | undefined> {
  try {
    return await queryClient.fetchQuery({
      queryKey: getTradingApiIndicativeQuoteQueryKey(params),
      queryFn: async () => fetchIndicativeQuote(params),
    })
  } catch (error) {
    if (is404Error(error)) {
      return undefined
    }
    throw error
  }
}
