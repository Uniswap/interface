import { type PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { keepPreviousData } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v2/api_connect'
import type {
  GetEarnPositionRequest,
  GetEarnPositionResponse,
  ListEarnPositionsRequest,
  ListEarnPositionsResponse,
  ListEarnVaultsRequest,
  ListEarnVaultsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { entryGatewayProdPostTransport } from 'uniswap/src/data/rest/base'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

const dataApiV2ServiceClient = createPromiseClient(DataApiService, entryGatewayProdPostTransport)

// TODO(CONS-1781): Earn list endpoints are currently intentionally bounded. If the data-api starts returning
// nextPageToken for these responses, add explicit pagination handling before exposing pageToken to callers.
type NonPaginatedListEarnVaultsRequest = Omit<PartialMessage<ListEarnVaultsRequest>, 'pageToken'>
type NonPaginatedListEarnPositionsRequest = Omit<PartialMessage<ListEarnPositionsRequest>, 'pageToken'>

export type ListEarnVaultsInput<TSelectData = ListEarnVaultsResponse> = {
  params?: NonPaginatedListEarnVaultsRequest
  enabled?: boolean
  select?: (data: ListEarnVaultsResponse | undefined) => TSelectData
}

export type ListEarnPositionsInput<TSelectData = ListEarnPositionsResponse> = {
  params?: NonPaginatedListEarnPositionsRequest
  enabled?: boolean
  select?: (data: ListEarnPositionsResponse | undefined) => TSelectData
}

export type GetEarnPositionInput<TSelectData = GetEarnPositionResponse> = {
  params?: PartialMessage<GetEarnPositionRequest>
  enabled?: boolean
  select?: (data: GetEarnPositionResponse | undefined) => TSelectData
}

type ListEarnVaultsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listEarnVaults',
  NonPaginatedListEarnVaultsRequest | undefined,
]

type ListEarnPositionsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listEarnPositions',
  NonPaginatedListEarnPositionsRequest | undefined,
]

type GetEarnPositionQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'getEarnPosition',
  PartialMessage<GetEarnPositionRequest> | undefined,
]

export function getListEarnVaultsQueryOptions<TSelectData = ListEarnVaultsResponse>({
  params,
  enabled = true,
  select,
}: ListEarnVaultsInput<TSelectData>): QueryOptionsResult<
  ListEarnVaultsResponse | undefined,
  Error,
  TSelectData,
  ListEarnVaultsQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults', params] as const,
    queryFn: async (): Promise<ListEarnVaultsResponse | undefined> => {
      if (!params) {
        return undefined
      }
      return dataApiV2ServiceClient.listEarnVaults(params)
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}

export function getListEarnPositionsQueryOptions<TSelectData = ListEarnPositionsResponse>({
  params,
  enabled = true,
  select,
}: ListEarnPositionsInput<TSelectData>): QueryOptionsResult<
  ListEarnPositionsResponse | undefined,
  Error,
  TSelectData,
  ListEarnPositionsQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions', params] as const,
    queryFn: async (): Promise<ListEarnPositionsResponse | undefined> => {
      if (!params) {
        return undefined
      }
      return dataApiV2ServiceClient.listEarnPositions(params)
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}

export function getEarnPositionQueryOptions<TSelectData = GetEarnPositionResponse>({
  params,
  enabled = true,
  select,
}: GetEarnPositionInput<TSelectData>): QueryOptionsResult<
  GetEarnPositionResponse | undefined,
  Error,
  TSelectData,
  GetEarnPositionQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getEarnPosition', params] as const,
    queryFn: async (): Promise<GetEarnPositionResponse | undefined> => {
      if (!params) {
        return undefined
      }
      return dataApiV2ServiceClient.getEarnPosition(params)
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}
