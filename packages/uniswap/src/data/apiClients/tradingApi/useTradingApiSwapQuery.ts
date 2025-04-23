import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { WithV4Flag, fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateSwapRequest, CreateSwapResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTradingApiSwapQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  WithV4Flag<CreateSwapRequest>,
  CreateSwapResponse
>): UseQueryResult<CreateSwapResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.swap, params]

  return useQueryWithImmediateGarbageCollection<CreateSwapResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchSwap> => await fetchSwap(params) : skipToken,
    ...rest,
  })
}
