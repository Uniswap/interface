import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { type InfiniteData, keepPreviousData } from '@tanstack/react-query'
import type {
  ListLaunchesRequest,
  ListLaunchesResponse,
  ListLaunchpadsRequest,
  ListLaunchpadsResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type ListLaunchpadsInput = {
  params?: PartialMessage<ListLaunchpadsRequest>
  enabled?: boolean
}

type ListLaunchpadsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listLaunchpads',
  ListLaunchpadsInput['params'],
]

export function getListLaunchpadsQueryOptions({
  params,
  enabled = true,
}: ListLaunchpadsInput): QueryOptionsResult<
  PlainMessage<ListLaunchpadsResponse> | undefined,
  Error,
  PlainMessage<ListLaunchpadsResponse> | undefined,
  ListLaunchpadsQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listLaunchpads', params] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async (): Promise<PlainMessage<ListLaunchpadsResponse> | undefined> => {
      if (!params) {
        return undefined
      }
      return toPlainMessage(await dataApiServiceClientV2.listLaunchpads(params))
    },
    enabled: enabled && !!params,
    placeholderData: keepPreviousData,
  })
}

/** Pagination is driven by the infinite query's page param, so callers can't set `page` themselves. */
export type ListLaunchesParams = Omit<PartialMessage<ListLaunchesRequest>, 'page'> & { pageSize?: number }

export type ListLaunchesInput = {
  params?: ListLaunchesParams
  enabled?: boolean
}

type ListLaunchesQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'listLaunches', ListLaunchesInput['params']]

export function getListLaunchesQueryOptions({
  params,
  enabled = true,
}: ListLaunchesInput): ReturnType<
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
        await dataApiServiceClientV2.listLaunches({
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
