import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { UNITAGS_API_CACHE_KEY, fetchUsername } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { UnitagUsernameRequest, UnitagUsernameResponse } from 'uniswap/src/features/unitags/types'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsUsernameQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<UnitagUsernameRequest, UnitagUsernameResponse>): UseQueryResult<UnitagUsernameResponse> {
  const queryKey = [UNITAGS_API_CACHE_KEY, 'username', params]

  return useQuery<UnitagUsernameResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchUsername> => await fetchUsername(params) : skipToken,
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    ...rest,
  })
}
