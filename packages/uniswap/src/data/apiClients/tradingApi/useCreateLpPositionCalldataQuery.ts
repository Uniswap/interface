import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import type { TradingApi, UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCreateLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<TradingApi.CreateLPPositionRequest, TradingApi.CreateLPPositionResponse> & {
  deadlineInMinutes?: number
}): UseQueryResult<TradingApi.CreateLPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.createLp, params]

  return useQuery<TradingApi.CreateLPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      const deadline = getTradeSettingsDeadline(deadlineInMinutes)
      const paramsWithDeadline = { ...params, deadline }
      return await TradingApiClient.createLpPosition(paramsWithDeadline)
    },
    ...rest,
  })
}
