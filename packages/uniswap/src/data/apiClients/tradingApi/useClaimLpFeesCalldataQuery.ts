import { UseQueryResult } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ClaimLPFeesRequest, ClaimLPFeesResponse } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingApiReplicaRequests } from './useTradingApiReplica'

export function useClaimLpFeesCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ClaimLPFeesRequest, ClaimLPFeesResponse>): UseQueryResult<ClaimLPFeesResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.claimLpFees, params]

  return useTradingApiReplica({
    params,
    request: TradingApiReplicaRequests.CLAIM_LP_FEES,
    skip: !rest.enabled,
  })
}
