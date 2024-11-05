import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, fetchIndicativeQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { IndicativeQuoteRequest, IndicativeQuoteResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'

export function useTradingApiIndicativeQuoteQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  IndicativeQuoteRequest,
  IndicativeQuoteResponse
>): UseQueryResult<IndicativeQuoteResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.indicativeQuote, params]

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
