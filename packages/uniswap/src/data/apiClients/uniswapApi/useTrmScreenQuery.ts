import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  fetchTrmScreen,
  type ScreenRequest,
  type ScreenResponse,
} from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
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
