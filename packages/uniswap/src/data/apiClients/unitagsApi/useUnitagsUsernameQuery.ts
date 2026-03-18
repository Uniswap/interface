import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type UnitagUsernameRequest, type UnitagUsernameResponse, type UseQueryApiHelperHookArgs } from '@universe/api'
import { UnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsUsernameQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<UnitagUsernameRequest, UnitagUsernameResponse>): UseQueryResult<UnitagUsernameResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'username', params]

  return useQuery<UnitagUsernameResponse>({
    queryKey,
    queryFn: params
      ? async (): Promise<UnitagUsernameResponse> => await UnitagsApiClient.fetchUsername(params)
      : skipToken,
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    ...rest,
  })
}
