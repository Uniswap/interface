import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import type { TradingApi, UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useDecreaseLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<TradingApi.DecreaseLPPositionRequest, TradingApi.DecreaseLPPositionResponse> & {
  deadlineInMinutes: number | undefined
}): UseQueryResult<TradingApi.DecreaseLPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.decreaseLp, params]

  const deadline = getTradeSettingsDeadline(deadlineInMinutes)
  const paramsWithDeadline = { ...params, deadline }

  return useQuery<TradingApi.DecreaseLPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await TradingApiClient.decreaseLpPosition(paramsWithDeadline)
    },
    ...rest,
  })
}
