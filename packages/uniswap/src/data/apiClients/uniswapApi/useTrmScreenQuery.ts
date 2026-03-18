import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type ScreenRequest, type ScreenResponse, type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniswapApiClient } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTrmScreenQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ScreenRequest, ScreenResponse>): UseQueryResult<ScreenResponse> {
  const queryKey = [ReactQueryCacheKey.UniswapApi, uniswapUrls.trmPath, params]

  return useQuery<ScreenResponse>({
    queryKey,
    queryFn: params ? async (): Promise<ScreenResponse> => await UniswapApiClient.fetchTrmScreen(params) : skipToken,
    ...rest,
  })
}
