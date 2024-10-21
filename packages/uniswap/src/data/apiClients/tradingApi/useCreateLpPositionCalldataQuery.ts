import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, createLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateLPPositionRequest, CreateLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'

export function useCreateLpPositionCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  CreateLPPositionRequest,
  CreateLPPositionResponse
>): UseQueryResult<CreateLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.createLp, params]

  return useQuery<CreateLPPositionResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof createLpPosition> => await createLpPosition(params) : skipToken,
    ...rest,
  })
}
