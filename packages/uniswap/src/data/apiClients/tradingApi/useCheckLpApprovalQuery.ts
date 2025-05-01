import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { checkLpApproval } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CheckApprovalLPRequest, CheckApprovalLPResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCheckLpApprovalQuery({
  params,
  headers,
  ...rest
}: UseQueryApiHelperHookArgs<CheckApprovalLPRequest, CheckApprovalLPResponse> & {
  headers?: Record<string, string>
}): UseQueryResult<CheckApprovalLPResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.lpApproval, params]

  return useQuery<CheckApprovalLPResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await checkLpApproval(params, headers)
    },
    ...rest,
  })
}
