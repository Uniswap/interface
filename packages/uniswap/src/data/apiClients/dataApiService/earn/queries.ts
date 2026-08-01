import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { keepPreviousData } from '@tanstack/react-query'
import type {
  GetEarnPositionRequest,
  GetEarnPositionResponse,
  ListEarnPositionsRequest,
  ListEarnPositionsResponse,
  ListEarnVaultsRequest,
  ListEarnVaultsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApi/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

// TODO(CONS-1781): Earn list endpoints are currently intentionally bounded. If the data-api starts returning
// nextPageToken for these responses, add explicit pagination handling before exposing pageToken to callers.
type NonPaginatedListEarnVaultsRequest = Omit<PartialMessage<ListEarnVaultsRequest>, 'pageToken'>
type NonPaginatedListEarnPositionsRequest = Omit<PartialMessage<ListEarnPositionsRequest>, 'pageToken'>

export type ListEarnVaultsInput<TSelectData = PlainMessage<ListEarnVaultsResponse>> = {
  params?: NonPaginatedListEarnVaultsRequest
  enabled?: boolean
  select?: (data: PlainMessage<ListEarnVaultsResponse> | undefined) => TSelectData
}

export type ListEarnPositionsInput<TSelectData = PlainMessage<ListEarnPositionsResponse>> = {
  params?: NonPaginatedListEarnPositionsRequest
  enabled?: boolean
  select?: (data: PlainMessage<ListEarnPositionsResponse> | undefined) => TSelectData
}

export type GetEarnPositionInput<TSelectData = PlainMessage<GetEarnPositionResponse>> = {
  params?: PartialMessage<GetEarnPositionRequest>
  enabled?: boolean
  select?: (data: PlainMessage<GetEarnPositionResponse> | undefined) => TSelectData
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

export function getListEarnVaultsQueryOptions<TSelectData = PlainMessage<ListEarnVaultsResponse>>({
  params,
  enabled = true,
  select,
}: ListEarnVaultsInput<TSelectData>): QueryOptionsResult<
  PlainMessage<ListEarnVaultsResponse> | undefined,
  Error,
  TSelectData,
  ListEarnVaultsQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults', params] as const,
    queryFn: async (): Promise<PlainMessage<ListEarnVaultsResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await dataApiServiceClientV2.listEarnVaults(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}

export function getListEarnPositionsQueryOptions<TSelectData = PlainMessage<ListEarnPositionsResponse>>({
  params,
  enabled = true,
  select,
}: ListEarnPositionsInput<TSelectData>): QueryOptionsResult<
  PlainMessage<ListEarnPositionsResponse> | undefined,
  Error,
  TSelectData,
  ListEarnPositionsQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions', params] as const,
    queryFn: async (): Promise<PlainMessage<ListEarnPositionsResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await dataApiServiceClientV2.listEarnPositions(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}

export function getEarnPositionQueryOptions<TSelectData = PlainMessage<GetEarnPositionResponse>>({
  params,
  enabled = true,
  select,
}: GetEarnPositionInput<TSelectData>): QueryOptionsResult<
  PlainMessage<GetEarnPositionResponse> | undefined,
  Error,
  TSelectData,
  GetEarnPositionQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getEarnPosition', params] as const,
    queryFn: async (): Promise<PlainMessage<GetEarnPositionResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await dataApiServiceClientV2.getEarnPosition(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}
