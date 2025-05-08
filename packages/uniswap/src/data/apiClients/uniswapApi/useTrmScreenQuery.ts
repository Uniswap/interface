import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import {
  ScreenRequest,
  ScreenResponse,
  UNISWAP_API_CACHE_KEY,
  fetchTrmScreen,
} from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'

export function useTrmScreenQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ScreenRequest, ScreenResponse>): UseQueryResult<ScreenResponse> {
  const queryKey = [UNISWAP_API_CACHE_KEY, uniswapUrls.trmPath, params]

  return useQuery<ScreenResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchTrmScreen> => await fetchTrmScreen(params) : skipToken,
    ...rest,
  })
}
