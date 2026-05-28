import { type PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { type InfiniteData } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type { ListTokensRequest, ListTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { createDataApiServiceClient } from '@universe/api'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableInfiniteQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

export type ListTokensParams = PartialMessage<ListTokensRequest>

export type ListTokensInput = {
  params?: Omit<ListTokensParams, 'pageToken'>
  enabled?: boolean
}

type ListTokensQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTokens', ListTokensInput['params']]

export const dataApiServiceClient = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, uniswapGetTransport),
})

export function getListTokensQueryOptions({
  params,
  enabled,
}: ListTokensInput): ReturnType<
  typeof persistableInfiniteQueryOptions<
    ListTokensResponse,
    Error,
    InfiniteData<ListTokensResponse, string>,
    ListTokensQueryKey,
    string
  >
> {
  return persistableInfiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTokens', params] as const,
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<ListTokensResponse> => {
      if (!params) {
        throw new Error('params required')
      }
      return dataApiServiceClient.listTokens({ ...params, pageToken: pageParam })
    },
    initialPageParam: '',
    getNextPageParam: (lastPage: ListTokensResponse) => lastPage.nextPageToken || undefined,
    enabled,
  })
}
