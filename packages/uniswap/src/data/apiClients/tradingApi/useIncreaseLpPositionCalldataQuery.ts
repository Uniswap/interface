import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { increaseLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { IncreaseLPPositionRequest, IncreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useIncreaseLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<IncreaseLPPositionRequest, IncreaseLPPositionResponse> & {
  deadlineInMinutes?: number
}): UseQueryResult<IncreaseLPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.increaseLp, params]

  const deadline = getTradeSettingsDeadline(deadlineInMinutes)

  const paramsWithDeadline = { ...params, deadline }
  return useQuery<IncreaseLPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await increaseLpPosition(paramsWithDeadline)
    },
    ...rest,
  })
}
