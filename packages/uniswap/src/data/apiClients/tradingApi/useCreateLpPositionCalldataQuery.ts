import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateLPPositionRequest, CreateLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCreateLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<CreateLPPositionRequest, CreateLPPositionResponse> & {
  deadlineInMinutes?: number
}): UseQueryResult<CreateLPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.createLp, params]
  const deadline = getTradeSettingsDeadline(deadlineInMinutes)
  const paramsWithDeadline = { ...params, deadline }

  return useQuery<CreateLPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await createLpPosition(paramsWithDeadline)
    },
    ...rest,
  })
}
