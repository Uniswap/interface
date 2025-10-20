import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { PoolInfoRequest, PoolInfoResponse } from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function usePoolInfoQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<PoolInfoRequest, PoolInfoResponse>): UseQueryResult<PoolInfoResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.poolInfo, params]

  return useQuery<PoolInfoResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await TradingApiClient.fetchPoolInfo(params)
    },
    ...rest,
  })
}
