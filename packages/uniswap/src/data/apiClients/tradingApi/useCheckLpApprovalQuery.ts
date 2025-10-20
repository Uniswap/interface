import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { TradingApi, UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCheckLpApprovalQuery({
  params,
  headers,
  ...rest
}: UseQueryApiHelperHookArgs<TradingApi.CheckApprovalLPRequest, TradingApi.CheckApprovalLPResponse> & {
  headers?: Record<string, string>
}): UseQueryResult<TradingApi.CheckApprovalLPResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.lpApproval, params]

  return useQuery<TradingApi.CheckApprovalLPResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await TradingApiClient.checkLpApproval(params, headers)
    },
    ...rest,
  })
}
