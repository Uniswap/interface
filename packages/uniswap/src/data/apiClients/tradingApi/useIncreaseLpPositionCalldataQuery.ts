import { UseQueryResult } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { IncreaseLPPositionRequest, IncreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingApiReplicaRequests } from './useTradingApiReplica'

export function useIncreaseLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<IncreaseLPPositionRequest, IncreaseLPPositionResponse> & {
  deadlineInMinutes?: number
}): UseQueryResult<IncreaseLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.increaseLp, params]

  const deadline = getTradeSettingsDeadline(deadlineInMinutes)

  const paramsWithDeadline = { ...params, deadline }

  return useTradingApiReplica({
    params,
    request: TradingApiReplicaRequests.INCREASE_LP_POSITION,
    skip: !rest.enabled,
  })
}
