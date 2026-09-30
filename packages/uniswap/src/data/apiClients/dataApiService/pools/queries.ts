import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { type InfiniteData } from '@tanstack/react-query'
import type { ListPoolsRequest, ListPoolsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { getConnectQueryRetryDelay, shouldRetryConnectQuery } from '@universe/api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

type ListPoolsInfiniteInput = {
  params?: Omit<PartialMessage<ListPoolsRequest>, 'page'>
  /** data.v2 PageRequest pageSize (default 100, max 100). */
  pageSize?: number
  enabled?: boolean
  persist?: boolean
}

type ListPoolsInfiniteQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listPools',
  ListPoolsInfiniteInput['params'],
  number | undefined,
  boolean,
]

export function getListPoolsInfiniteQueryOptions({
  params,
  pageSize,
  enabled = true,
  persist = true,
}: ListPoolsInfiniteInput): ReturnType<
  typeof persistableInfiniteQueryOptions<
    PlainMessage<ListPoolsResponse>,
    Error,
    InfiniteData<PlainMessage<ListPoolsResponse>>,
    ListPoolsInfiniteQueryKey,
    string
  >
> {
  const options = persistableInfiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listPools', params, pageSize, persist] as const,
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<PlainMessage<ListPoolsResponse>> => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(
        await dataApiServiceClientV2.listPools({ ...params, page: { pageSize, pageToken: pageParam || undefined } }),
      )
    },
    initialPageParam: '',
    // Trust the token, even on a short or empty page. The backend fetches limit+1 rows, so a final
    // page never carries one; a page that is short AND carries one is a ranked walk that hit its
    // candidate budget (searched dense prefixes, ascending sorts), and the token resumes the walk
    // where it stopped. Ending on an empty page there would show "no pools" while matches sit
    // further down the walk. A runaway loop is bounded by the Table's no-growth fetch budget.
    getNextPageParam: (lastPage: PlainMessage<ListPoolsResponse>) => lastPage.page?.nextPageToken || undefined,
    // Without a retry, one failed request drops the pools table into its error state until the next
    // heartbeat tick (up to 60s away on Explore; PoolBrowser has none). The cold-cache
    // `Code.Unavailable` stampede response in particular needs a real backoff — see connectRpc/retry.
    retry: shouldRetryConnectQuery,
    retryDelay: getConnectQueryRetryDelay,
    enabled: enabled && !!params,
  })
  return persist ? options : { ...options, meta: { ...options.meta, persist: false } }
}

type ListPoolsInput<TSelectData = PlainMessage<ListPoolsResponse>> = {
  params?: Omit<PartialMessage<ListPoolsRequest>, 'page'>
  /** data.v2 PageRequest pageSize (default 100, max 100). */
  pageSize?: number
  enabled?: boolean
  select?: (data: PlainMessage<ListPoolsResponse>) => TSelectData
}

type ListPoolsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listPoolsPage',
  ListPoolsInput['params'],
  number | undefined,
]

/**
 * Single-page ListPools
 */
export function getListPoolsQueryOptions<TSelectData = PlainMessage<ListPoolsResponse>>({
  params,
  pageSize,
  enabled = true,
  select,
}: ListPoolsInput<TSelectData>): QueryOptionsResult<
  PlainMessage<ListPoolsResponse>,
  Error,
  TSelectData,
  ListPoolsQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listPoolsPage', params, pageSize] as const,
    queryFn: async (): Promise<PlainMessage<ListPoolsResponse>> => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(await dataApiServiceClientV2.listPools({ ...params, page: { pageSize } }))
    },
    retry: shouldRetryConnectQuery,
    retryDelay: getConnectQueryRetryDelay,
    enabled: enabled && !!params,
    select,
  })
}
