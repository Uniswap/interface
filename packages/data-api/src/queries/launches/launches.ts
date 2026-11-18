import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { type InfiniteData, keepPreviousData } from '@tanstack/react-query'
import type {
  ListLaunchesRequest,
  ListLaunchesResponse,
  ListLaunchpadsRequest,
  ListLaunchpadsResponse,
} from '@uniswap/client-launches/dist/launches/v1/api_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import type { LaunchServiceClient } from '../../clients/createLaunchServiceClient'

// Both query keys below deliberately keep the ReactQueryCacheKey.DataApiService prefix even though
// the reads now go through launches.v1.LaunchService: the launches.v1 messages are wire- and
// JSON-identical to their data.v2 twins, so the persisted payload shape is unchanged and renaming
// the key would only cold-start every user's persisted cache.

export type ListLaunchpadsInput<TSelectData = PlainMessage<ListLaunchpadsResponse> | undefined> = {
  params?: PartialMessage<ListLaunchpadsRequest>
  enabled?: boolean
  select?: (data: PlainMessage<ListLaunchpadsResponse> | undefined) => TSelectData
}

type ListLaunchpadsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listLaunchpads',
  ListLaunchpadsInput['params'],
]

export function getListLaunchpadsQueryOptions<TSelectData = PlainMessage<ListLaunchpadsResponse> | undefined>(
  client: LaunchServiceClient,
  { params, enabled = true, select }: ListLaunchpadsInput<TSelectData>,
): QueryOptionsResult<PlainMessage<ListLaunchpadsResponse> | undefined, Error, TSelectData, ListLaunchpadsQueryKey> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listLaunchpads', params] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async (): Promise<PlainMessage<ListLaunchpadsResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await client.listLaunchpads(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
    select,
  })
}

/** Pagination is driven by the infinite query's page param, so callers can't set `page` themselves. */
export type ListLaunchesParams = Omit<PartialMessage<ListLaunchesRequest>, 'page'> & { pageSize?: number }

export type ListLaunchesInput = {
  params?: ListLaunchesParams
  enabled?: boolean
}

type ListLaunchesQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listLaunches', ListLaunchesInput['params']]

export function getListLaunchesQueryOptions(
  client: LaunchServiceClient,
  { params, enabled = true }: ListLaunchesInput,
): ReturnType<
  typeof persistableInfiniteQueryOptions<
    PlainMessage<ListLaunchesResponse>,
    Error,
    InfiniteData<PlainMessage<ListLaunchesResponse>, string>,
    ListLaunchesQueryKey,
    string
  >
> {
  return persistableInfiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listLaunches', params] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<PlainMessage<ListLaunchesResponse>> => {
      if (!params) {
        throw new Error('params required')
      }
      const { pageSize, ...request } = params
      return toPlainMessage(
        await client.listLaunches({
          ...request,
          page: { pageSize, pageToken: pageParam || undefined },
        }),
      )
    },
    initialPageParam: '',
    getNextPageParam: (lastPage: PlainMessage<ListLaunchesResponse>) => lastPage.page?.nextPageToken || undefined,
    enabled: enabled && !!params,
  })
}
