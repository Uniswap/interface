import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateLPPositionRequest, CreateLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingAPIReplicaResult, TradingApiReplicaRequests } from './useTradingApiReplica'

export function useCreateLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<CreateLPPositionRequest, CreateLPPositionResponse> & {
  deadlineInMinutes?: number
}): TradingAPIReplicaResult<CreateLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.createLp, params]
  const deadline = getTradeSettingsDeadline(deadlineInMinutes)
  const paramsWithDeadline = { ...params, deadline }

  return useTradingApiReplica({
    params: paramsWithDeadline,
    request: TradingApiReplicaRequests.CREATE_LP_POSITION,
    skip: !rest.enabled,
  })
}
