import { PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
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
}: UseQueryApiHelperHookArgs<PlainMessage<GetAddressRequest>, PlainMessage<GetAddressResponse>>): UseQueryResult<
  PlainMessage<GetAddressResponse>
> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'address', params]
  const canFetch = params !== undefined && isEVMAddress(params.address)

  return useQuery(
    persistableQueryOptions<PlainMessage<GetAddressResponse>>({
      queryKey,
      queryFn: canFetch
        ? async (): Promise<PlainMessage<GetAddressResponse>> =>
            toPlainMessage(new GetAddressResponse(await unitagsApiClient.fetchAddress(params)))
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
}: UseQueryApiHelperHookArgs<PlainMessage<GetAddressesRequest>, PlainMessage<GetAddressesResponse>>): UseQueryResult<
  PlainMessage<GetAddressesResponse>
> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'addresses', params]

  return useQuery(
    persistableQueryOptions<PlainMessage<GetAddressesResponse>>({
      queryKey,
      queryFn: params
        ? async (): Promise<PlainMessage<GetAddressesResponse>> =>
            toPlainMessage(new GetAddressesResponse(await unitagsApiClient.fetchUnitagsByAddresses(params)))
        : skipToken,
      staleTime: ONE_MINUTE_MS,
      gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
      ...rest,
    }),
  )
}
