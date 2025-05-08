import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { claimLpFees } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ClaimLPFeesRequest, ClaimLPFeesResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useClaimLpFeesCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ClaimLPFeesRequest, ClaimLPFeesResponse>): UseQueryResult<ClaimLPFeesResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.claimLpFees, params]

  return useQuery<ClaimLPFeesResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await claimLpFees(params)
    },
    ...rest,
  })
}
