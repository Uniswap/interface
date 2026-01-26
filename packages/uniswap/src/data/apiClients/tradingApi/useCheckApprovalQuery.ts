import { skipToken, type UseQueryResult } from '@tanstack/react-query'
import {
  type TradingApi,
  type UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
  useQueryWithImmediateGarbageCollection,
} from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCheckApprovalQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  TradingApi.ApprovalRequest,
  TradingApi.ApprovalResponse
>): UseQueryResult<TradingApi.ApprovalResponse> {
  const queryKey = params
    ? [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.approval, params]
    : [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.approval, 'skip']

  return useQueryWithImmediateGarbageCollection<TradingApi.ApprovalResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof TradingApiClient.fetchCheckApproval> =>
          await TradingApiClient.fetchCheckApproval(params)
      : skipToken,
    ...rest,
  })
}
