import { type PartialMessage } from '@bufbuild/protobuf'
import { type ConnectError } from '@connectrpc/connect'
import { queryOptions } from '@tanstack/react-query'
import type { SearchRequest, SearchResponse } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { type SearchServiceClient } from '../../clients/createSearchServiceClient'

export type SearchInput<TSelectData = SearchResponse> = {
  params?: PartialMessage<SearchRequest>
  enabled?: boolean
  select?: (data: SearchResponse) => TSelectData
}

type SearchQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'search', PartialMessage<SearchRequest> | undefined]

/**
 * data.v2 SearchService. One request covers every requested result type (tokens, pools, auctions,
 * categories) via `params.types`; the response buckets tokens into default and suppressed.
 */
export function getSearchQueryOptions<TSelectData = SearchResponse>(
  client: SearchServiceClient,
  { params, enabled = true, select }: SearchInput<TSelectData>,
): QueryOptionsResult<SearchResponse, ConnectError, TSelectData, SearchQueryKey> {
  return queryOptions<SearchResponse, ConnectError, TSelectData, SearchQueryKey>({
    queryKey: [ReactQueryCacheKey.DataApiService, 'search', params] as const,
    queryFn: () => {
      if (!params) {
        throw new Error('params required')
      }
      return client.search(params)
    },
    enabled: enabled && !!params,
    select,
  })
}
