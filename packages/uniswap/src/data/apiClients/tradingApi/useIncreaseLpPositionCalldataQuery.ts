import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, increaseLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { IncreaseLPPositionRequest, IncreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'

export function useIncreaseLpPositionCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse
>): UseQueryResult<IncreaseLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.increaseLp, params]

  return useQuery<IncreaseLPPositionResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof increaseLpPosition> => await increaseLpPosition(params) : skipToken,
    ...rest,
  })
}
