import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type ScreenRequest, type ScreenResponse, type UseQueryApiHelperHookArgs } from '@universe/api'
import { ComplianceApiClient } from 'uniswap/src/data/apiClients/uniswapApi/ComplianceApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTrmScreenQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ScreenRequest, ScreenResponse>): UseQueryResult<ScreenResponse> {
  const queryKey = [ReactQueryCacheKey.Compliance, params]

  return useQuery<ScreenResponse>({
    queryKey,
    queryFn: params ? async (): Promise<ScreenResponse> => await ComplianceApiClient.screenAddress(params) : skipToken,
    ...rest,
  })
}
