import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, fetchSwappableTokens } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ChainId, GetSwappableTokensResponse } from 'uniswap/src/data/tradingApi/__generated__'

export type SwappableTokensParams = {
  tokenIn: Address
  tokenInChainId: ChainId
  tokenOut?: Address
  tokenOutChainId?: ChainId
}

export function useTradingApiSwappableTokensQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  SwappableTokensParams,
  GetSwappableTokensResponse
>): UseQueryResult<GetSwappableTokensResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.swappableTokens, params]

  return useQuery<GetSwappableTokensResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof fetchSwappableTokens> => await fetchSwappableTokens(params)
      : skipToken,
    ...rest,
  })
}
