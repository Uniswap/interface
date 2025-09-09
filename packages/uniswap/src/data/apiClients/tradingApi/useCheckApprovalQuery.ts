import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { fetchCheckApproval } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ApprovalRequest, ApprovalResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useCheckApprovalQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  ApprovalRequest,
  ApprovalResponse
>): UseQueryResult<ApprovalResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.approval, params]

  return useQueryWithImmediateGarbageCollection<ApprovalResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchCheckApproval> => await fetchCheckApproval(params) : skipToken,
    ...rest,
  })
}
