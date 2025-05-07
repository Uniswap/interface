import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, claimLpFees } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ClaimLPFeesRequest, ClaimLPFeesResponse } from 'uniswap/src/data/tradingApi/__generated__'

export function useClaimLpFeesCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ClaimLPFeesRequest, ClaimLPFeesResponse>): UseQueryResult<ClaimLPFeesResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.claimLpFees, params]

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
