import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  type UnitagAddressesRequest,
  type UnitagAddressesResponse,
  type UnitagAddressRequest,
  type UnitagAddressResponse,
  type UseQueryApiHelperHookArgs,
} from '@universe/api'
import { UnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsAddressQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<UnitagAddressRequest, UnitagAddressResponse>): UseQueryResult<UnitagAddressResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'address', params]
  const isValidEVMAddress = isEVMAddress(params?.address)

  return useQuery<UnitagAddressResponse>({
    queryKey,
    queryFn:
      params && isValidEVMAddress
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
