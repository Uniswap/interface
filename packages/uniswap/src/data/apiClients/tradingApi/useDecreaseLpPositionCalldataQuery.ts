import { UseQueryResult } from '@tanstack/react-query'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { DecreaseLPPositionRequest, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingApiReplicaRequests } from './useTradingApiReplica'

export function useDecreaseLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<DecreaseLPPositionRequest, DecreaseLPPositionResponse> & {
  deadlineInMinutes: number | undefined
}): UseQueryResult<DecreaseLPPositionResponse> {
  const deadline = getTradeSettingsDeadline(deadlineInMinutes)
  const paramsWithDeadline = { ...params, deadline }

  return useTradingApiReplica({
    params: paramsWithDeadline,
    request: TradingApiReplicaRequests.DECREASE_LP_POSITION,
    skip: !rest.enabled,
  })
}
