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
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'

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

export function getListEarnVaultsQueryOptions<TSelectData = PlainMessage<ListEarnVaultsResponse>>(
  client: DataApiServiceClientV2,
  { params, enabled = true, select }: ListEarnVaultsInput<TSelectData>,
): QueryOptionsResult<PlainMessage<ListEarnVaultsResponse> | undefined, Error, TSelectData, ListEarnVaultsQueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults', params] as const,
    queryFn: async (): Promise<PlainMessage<ListEarnVaultsResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await client.listEarnVaults(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
    staleTime: ONE_MINUTE_MS,
  })
}

export function getListEarnPositionsQueryOptions<TSelectData = PlainMessage<ListEarnPositionsResponse>>(
  client: DataApiServiceClientV2,
  { params, enabled = true, select }: ListEarnPositionsInput<TSelectData>,
): QueryOptionsResult<
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
      return toPlainMessage(await client.listEarnPositions(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
    staleTime: ONE_MINUTE_MS,
  })
}

export function getEarnPositionQueryOptions<TSelectData = PlainMessage<GetEarnPositionResponse>>(
  client: DataApiServiceClientV2,
  { params, enabled = true, select }: GetEarnPositionInput<TSelectData>,
): QueryOptionsResult<PlainMessage<GetEarnPositionResponse> | undefined, Error, TSelectData, GetEarnPositionQueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getEarnPosition', params] as const,
    queryFn: async (): Promise<PlainMessage<GetEarnPositionResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await client.getEarnPosition(params))
    },
    enabled: enabled && !!params,
    // No-position selectors return undefined, which can loop with keepPreviousData when the query key changes.
    select,
    staleTime: ONE_MINUTE_MS,
  })
}
