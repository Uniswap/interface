import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  type UnitagAddressesRequest,
  type UnitagAddressesResponse,
  type UnitagAddressRequest,
  type UnitagAddressResponse,
  UnitagsApiClient,
  type UseQueryApiHelperHookArgs,
} from '@universe/api'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsAddressQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<UnitagAddressRequest, UnitagAddressResponse>): UseQueryResult<UnitagAddressResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'address', params]

  return useQuery<UnitagAddressResponse>({
    queryKey,
    queryFn: params
      ? async (): Promise<UnitagAddressResponse> => await UnitagsApiClient.fetchAddress(params)
      : skipToken,
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    ...rest,
  })
}

export function useUnitagsAddressesQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  UnitagAddressesRequest,
  UnitagAddressesResponse
>): UseQueryResult<UnitagAddressesResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'addresses', params]

  return useQuery<UnitagAddressesResponse>({
    queryKey,
    queryFn: params
      ? async (): Promise<UnitagAddressesResponse> => await UnitagsApiClient.fetchUnitagsByAddresses(params)
      : skipToken,
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    ...rest,
  })
}
