import { type PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type { ListTopTokensRequest, ListTopTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { createDataApiServiceClient } from '@universe/api'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type ListTopTokensInput = {
  params?: Omit<PartialMessage<ListTopTokensRequest>, 'pageToken'>
  enabled?: boolean
}

type ListTopTokensQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTopTokens', ListTopTokensInput['params']]

const client = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, uniswapGetTransport),
})

export function getListTopTokensQueryOptions({
  params,
  enabled,
}: ListTopTokensInput): ReturnType<
  typeof infiniteQueryOptions<ListTopTokensResponse, Error, ListTopTokensResponse, ListTopTokensQueryKey, string>
> {
  return infiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTopTokens', params] as const,
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<ListTopTokensResponse> => {
      if (!params) {
        throw new Error('params required')
      }
      return client.listTopTokens({ ...params, pageToken: pageParam }) as Promise<ListTopTokensResponse>
    },
    initialPageParam: '',
    getNextPageParam: (lastPage: ListTopTokensResponse) => lastPage.nextPageToken || undefined,
    enabled,
  })
}
