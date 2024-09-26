import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, reduceLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ReduceLPPositionRequest, ReduceLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'

export function useReduceLpPositionCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  ReduceLPPositionRequest,
  ReduceLPPositionResponse
>): UseQueryResult<ReduceLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.reduceLp, params]

  return useQuery<ReduceLPPositionResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof reduceLpPosition> => await reduceLpPosition(params) : skipToken,
    ...rest,
  })
}
