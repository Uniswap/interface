import { type PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type { ListTopPoolsRequest, ListTopPoolsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { createDataApiServiceClient } from '@universe/api'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type ListTopPoolsInput = {
  params?: Omit<PartialMessage<ListTopPoolsRequest>, 'pageToken'>
  enabled?: boolean
}

type ListTopPoolsQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTopPools', ListTopPoolsInput['params']]

const client = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, uniswapGetTransport),
})

export function getListTopPoolsQueryOptions({
  params,
  enabled,
}: ListTopPoolsInput): ReturnType<
  typeof infiniteQueryOptions<ListTopPoolsResponse, Error, ListTopPoolsResponse, ListTopPoolsQueryKey, string>
> {
  return infiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTopPools', params] as const,
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<ListTopPoolsResponse> => {
      if (!params) {
        throw new Error('params required')
      }
      return client.listTopPools({ ...params, pageToken: pageParam }) as Promise<ListTopPoolsResponse>
    },
    initialPageParam: '',
    getNextPageParam: (lastPage: ListTopPoolsResponse) => lastPage.nextPageToken || undefined,
    enabled,
  })
}
