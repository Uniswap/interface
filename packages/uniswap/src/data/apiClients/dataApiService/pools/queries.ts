import { type PlainMessage } from '@bufbuild/protobuf'
import type { ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  getListPoolsInfiniteQueryOptions as getListPoolsInfiniteQueryOptionsWithClient,
  getListPoolsQueryOptions as getListPoolsQueryOptionsWithClient,
  type ListPoolsInfiniteInput,
  type ListPoolsInput,
} from '@universe/data-api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'

export function getListPoolsInfiniteQueryOptions(
  input: ListPoolsInfiniteInput,
): ReturnType<typeof getListPoolsInfiniteQueryOptionsWithClient> {
  return getListPoolsInfiniteQueryOptionsWithClient(dataApiServiceClientV2, input)
}

export function getListPoolsQueryOptions<TSelectData = PlainMessage<ListPoolsResponse>>(
  input: ListPoolsInput<TSelectData>,
): ReturnType<typeof getListPoolsQueryOptionsWithClient<TSelectData>> {
  return getListPoolsQueryOptionsWithClient(dataApiServiceClientV2, input)
}
