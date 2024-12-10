import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, createLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateLPPositionRequest, CreateLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'

export function useCreateLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<CreateLPPositionRequest, CreateLPPositionResponse> & {
  deadlineInMinutes: number | undefined
}): UseQueryResult<CreateLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.createLp, params]

  const deadline = getTradeSettingsDeadline(deadlineInMinutes)

  const paramsWithDeadline = { ...params, deadline }
  return useQuery<CreateLPPositionResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof createLpPosition> => await createLpPosition(paramsWithDeadline)
      : skipToken,
    ...rest,
  })
}
