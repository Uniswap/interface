import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { decreaseLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { DecreaseLPPositionRequest, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useDecreaseLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<DecreaseLPPositionRequest, DecreaseLPPositionResponse> & {
  deadlineInMinutes: number | undefined
}): UseQueryResult<DecreaseLPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.decreaseLp, params]

  const deadline = getTradeSettingsDeadline(deadlineInMinutes)
  const paramsWithDeadline = { ...params, deadline }

  return useQuery<DecreaseLPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await decreaseLpPosition(paramsWithDeadline)
    },
    ...rest,
  })
}
