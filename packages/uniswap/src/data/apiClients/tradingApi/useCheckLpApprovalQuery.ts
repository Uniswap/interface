import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CheckApprovalLPRequest, CheckApprovalLPResponse } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingAPIReplicaResult, TradingApiReplicaRequests } from './useTradingApiReplica'

export function useCheckLpApprovalQuery({
  params,
  headers,
  ...rest
}: UseQueryApiHelperHookArgs<CheckApprovalLPRequest, CheckApprovalLPResponse> & {
  headers?: Record<string, string>
}): TradingAPIReplicaResult<CheckApprovalLPResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.lpApproval, params]

  return useTradingApiReplica({
    params,
    request: TradingApiReplicaRequests.CHECK_LP_APPROVAL,
    skip: !rest.enabled,
  })
}
