import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import {
  UNITAGS_API_CACHE_KEY,
  fetchAddress,
  fetchAddresses,
} from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import {
  UnitagAddressRequest,
  UnitagAddressResponse,
  UnitagAddressesRequest,
  UnitagAddressesResponse,
} from 'uniswap/src/features/unitags/types'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsAddressQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<UnitagAddressRequest, UnitagAddressResponse>): UseQueryResult<UnitagAddressResponse> {
  const queryKey = [UNITAGS_API_CACHE_KEY, 'address', params]

  return useQuery<UnitagAddressResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchAddress> => await fetchAddress(params) : skipToken,
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
  const queryKey = [UNITAGS_API_CACHE_KEY, 'addresses', params]

  return useQuery<UnitagAddressesResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchAddresses> => await fetchAddresses(params) : skipToken,
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
    ...rest,
  })
}
