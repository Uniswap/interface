import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, decreaseLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { DecreaseLPPositionRequest, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'

export function useDecreaseLpPositionCalldataQuery({
  params,
  deadlineInMinutes,
  ...rest
}: UseQueryApiHelperHookArgs<DecreaseLPPositionRequest, DecreaseLPPositionResponse> & {
  deadlineInMinutes: number | undefined
}): UseQueryResult<DecreaseLPPositionResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.decreaseLp, params]

  const deadline = getTradeSettingsDeadline(deadlineInMinutes)
  const paramsWithDeadline = { ...params, deadline }

  return useQuery<DecreaseLPPositionResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof decreaseLpPosition> => await decreaseLpPosition(paramsWithDeadline)
      : skipToken,
    ...rest,
  })
}
