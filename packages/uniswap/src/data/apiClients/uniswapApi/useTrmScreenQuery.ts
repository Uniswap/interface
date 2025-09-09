import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ScreenRequest, ScreenResponse, fetchTrmScreen } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTrmScreenQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ScreenRequest, ScreenResponse>): UseQueryResult<ScreenResponse> {
  const queryKey = [ReactQueryCacheKey.UniswapApi, uniswapUrls.trmPath, params]

  return useQuery<ScreenResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchTrmScreen> => await fetchTrmScreen(params) : skipToken,
    ...rest,
  })
}
