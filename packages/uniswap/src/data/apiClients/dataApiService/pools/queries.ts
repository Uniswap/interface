import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type {
  GetProtocolFeesRequest,
  GetProtocolFeesResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { createDataApiServiceClient } from '@universe/api'
import { entryGatewayPostTransport } from 'uniswap/src/data/rest/base'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type ListTopPoolsInput = {
  params?: Omit<PartialMessage<ListTopPoolsRequest>, 'pageToken'>
  enabled?: boolean
}

type ListTopPoolsQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listTopPools', ListTopPoolsInput['params']]

const client = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, entryGatewayPostTransport),
})

export function getListTopPoolsQueryOptions({
  params,
  enabled,
}: ListTopPoolsInput): ReturnType<
  typeof persistableInfiniteQueryOptions<
    PlainMessage<ListTopPoolsResponse>,
    Error,
    PlainMessage<ListTopPoolsResponse>,
    ListTopPoolsQueryKey,
    string
  >
> {
  return persistableInfiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTopPools', params] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<PlainMessage<ListTopPoolsResponse>> => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.listTopPools({ ...params, pageToken: pageParam }))
    },
    initialPageParam: '',
    getNextPageParam: (lastPage: PlainMessage<ListTopPoolsResponse>) => lastPage.nextPageToken || undefined,
    enabled,
  })
}

export type GetProtocolFeesInput = {
  params?: PartialMessage<GetProtocolFeesRequest>
  enabled?: boolean
}

type GetProtocolFeesQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'getProtocolFees',
  PartialMessage<GetProtocolFeesRequest> | undefined,
]

/**
 * Batched per-pool protocol/effective fees (data-api `GetProtocolFees`, backend#10486).
 * One request covers <=100 pools of a single chain + protocol version; both fee fields are
 * TRUE-optional on the wire, so a missing value means "unavailable" (never 0) and a served 0
 * is a real value (fee switch off). Served-or-nothing: the FE never computes fees.
 */
export function getProtocolFeesQueryOptions({
  params,
  enabled = true,
}: GetProtocolFeesInput): QueryOptionsResult<
  PlainMessage<GetProtocolFeesResponse> | undefined,
  Error,
  PlainMessage<GetProtocolFeesResponse> | undefined,
  GetProtocolFeesQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getProtocolFees', params] as const,
    queryFn: async (): Promise<PlainMessage<GetProtocolFeesResponse> | undefined> => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await client.getProtocolFees(params))
    },
    enabled: enabled && !!params?.poolIds?.length,
  })
}
