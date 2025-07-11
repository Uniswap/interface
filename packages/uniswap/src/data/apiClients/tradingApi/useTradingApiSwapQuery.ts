import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, WithV4Flag } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateSwapRequest, CreateSwapResponse } from 'uniswap/src/data/tradingApi/__generated__'
import useTradingApiReplica, { TradingAPIReplicaResult, TradingApiReplicaRequests } from './useTradingApiReplica'

export function useTradingApiSwapQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  WithV4Flag<CreateSwapRequest>,
  CreateSwapResponse
>): TradingAPIReplicaResult<CreateSwapResponse> {
  const queryKey = [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.swap, params]

  return useTradingApiReplica({
    request: TradingApiReplicaRequests.SWAP,
    params: params,
  })
}
