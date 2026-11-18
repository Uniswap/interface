import { type ConnectError } from '@connectrpc/connect'
import { type InfiniteData, infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { type ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { GetProtocolStatsResponse, ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, type TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type InfiniteQueryOptionsResult, type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'

/** Query-key prefix shared with the Explore heartbeat so it can refetch this query without knowing its inputs. */
export const GET_PROTOCOL_STATS_QUERY_KEY_PREFIX = [ReactQueryCacheKey.DataApiService, 'getProtocolStats'] as const

export type GetProtocolStatsInput = {
  chainIds: number[]
  protocolVersions: ProtocolVersion[]
  enabled?: boolean
}

type GetProtocolStatsQueryKey = readonly [...typeof GET_PROTOCOL_STATS_QUERY_KEY_PREFIX, number[], ProtocolVersion[]]

/**
 * v2 GetProtocolStats: protocol TVL and trailing-1D volume with server-computed 1D % changes,
 * both as a total and per protocol version. The BE rejects an empty chain set, so the query
 * stays idle until at least one chain is known.
 */
export function getGetProtocolStatsQueryOptions(
  client: DataApiServiceClientV2,
  { chainIds, protocolVersions, enabled = true }: GetProtocolStatsInput,
): QueryOptionsResult<GetProtocolStatsResponse, ConnectError, GetProtocolStatsResponse, GetProtocolStatsQueryKey> {
  return queryOptions<GetProtocolStatsResponse, ConnectError, GetProtocolStatsResponse, GetProtocolStatsQueryKey>({
    queryKey: [...GET_PROTOCOL_STATS_QUERY_KEY_PREFIX, chainIds, protocolVersions] as const,
    queryFn: () => client.getProtocolStats({ chainIds, protocolVersions }),
    staleTime: ONE_MINUTE_MS,
    // The global retry policy only covers FetchError 500s, which a ConnectRPC error never is.
    retry: 2,
    enabled: enabled && chainIds.length > 0,
  })
}

export type ExploreListTokensInput = {
  chainIds: number[]
  orderBy: TokensOrderBy
  ascending: boolean
  pageSize: number
  categoryId?: string
  enabled?: boolean
}

type ExploreListTokensQueryKey = readonly [
  ReactQueryCacheKey.TopTokens,
  'v2',
  number[],
  TokensOrderBy,
  boolean,
  number,
  string | undefined,
]

/**
 * v2 ListTokens for Explore-style token lists. Unlike TokenRankings, v2 is single-sort and
 * paginated: the query key includes orderBy/ascending so sort changes trigger a fresh fetch, and
 * callers page forward via fetchNextPage rather than getting every sort order back in one response.
 */
export function getExploreListTokensInfiniteQueryOptions(
  client: DataApiServiceClientV2,
  { chainIds, orderBy, ascending, pageSize, categoryId, enabled = true }: ExploreListTokensInput,
): InfiniteQueryOptionsResult<
  ListTokensResponse,
  Error,
  InfiniteData<ListTokensResponse>,
  ExploreListTokensQueryKey,
  string
> {
  return infiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.TopTokens, 'v2', chainIds, orderBy, ascending, pageSize, categoryId] as const,
    queryFn: ({ pageParam }) =>
      client.listTokens({
        chainIds,
        page: { pageSize, pageToken: pageParam },
        sort: { orderBy, ascending },
        // Required by BE — UNSPECIFIED is rejected, mirrors apps/web's getListTokens.ts.
        sparklineDuration: HistoryDuration.DAY,
        ...(categoryId !== undefined && { filter: { categoryIds: [categoryId] } }),
      }),
    getNextPageParam: (lastPage: ListTokensResponse) => lastPage.page?.nextPageToken || undefined,
    initialPageParam: '',
    staleTime: ONE_MINUTE_MS,
    // The global retry policy only covers FetchError 500s, which a ConnectRPC error never is —
    // without this, one failed request drops the token list into its error state.
    retry: 2,
    enabled,
  })
}
