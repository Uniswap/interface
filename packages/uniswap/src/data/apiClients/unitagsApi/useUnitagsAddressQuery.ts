import { PlainMessage } from '@bufbuild/protobuf'
import { skipToken, useQuery, type UseQueryResult } from '@tanstack/react-query'
import {
  GetAddressesRequest,
  GetAddressesResponse,
  GetAddressRequest,
  GetAddressResponse,
  type UseQueryApiHelperHookArgs,
} from '@universe/api'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsAddressQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<PlainMessage<GetAddressRequest>, GetAddressResponse>): UseQueryResult<GetAddressResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'address', params]
  const canFetch = params !== undefined && isEVMAddress(params.address)

  return useQuery(
    persistableQueryOptions<GetAddressResponse>({
      queryKey,
      queryFn: canFetch
        ? async (): Promise<GetAddressResponse> => new GetAddressResponse(await unitagsApiClient.fetchAddress(params))
        : skipToken,
      staleTime: ONE_MINUTE_MS,
      gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
      ...rest,
    }),
  )
}

export function useUnitagsAddressesQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  PlainMessage<GetAddressesRequest>,
  GetAddressesResponse
>): UseQueryResult<GetAddressesResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'addresses', params]

  return useQuery(
    persistableQueryOptions<GetAddressesResponse>({
      queryKey,
      queryFn: params
        ? async (): Promise<GetAddressesResponse> =>
            new GetAddressesResponse(await unitagsApiClient.fetchUnitagsByAddresses(params))
        : skipToken,
      staleTime: ONE_MINUTE_MS,
      gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
      ...rest,
    }),
  )
}
