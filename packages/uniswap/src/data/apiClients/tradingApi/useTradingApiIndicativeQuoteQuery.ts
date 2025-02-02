import { QueryClient, UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
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
export async function fetchTradingApiIndicativeQuote({
  queryClient = SharedQueryClient,
  params,
}: {
  queryClient?: QueryClient
  params: IndicativeQuoteRequest
}): Promise<IndicativeQuoteResponse> {
  return queryClient.fetchQuery({
    queryKey: getTradingApiIndicativeQuoteQueryKey(params),
    queryFn: async () => fetchIndicativeQuote(params),
  })
}
