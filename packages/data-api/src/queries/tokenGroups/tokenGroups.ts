import { Code, ConnectError } from '@connectrpc/connect'
import { type InfiniteData, infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { GetTokenGroupResponse, ListTokenGroupsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, type TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type InfiniteQueryOptionsResult, type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'

const TOKEN_GROUPS_PAGE_SIZE = 100

/** A deployment used as the GetTokenGroup `member` selector. */
export type TokenGroupMember = { chainId: number; address: string }

export type GetTokenGroupInput = {
  member: TokenGroupMember | undefined
  chainIds: number[]
  enabled?: boolean
}

type GetTokenGroupQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'getTokenGroup',
  number | undefined,
  string | undefined,
  number[],
]

/** NOT_FOUND is the backend's "ungrouped token" answer, so it resolves to `null` instead of an error. */
async function fetchTokenGroupByMember({
  client,
  member,
  chainIds,
}: {
  client: DataApiServiceClientV2
  member: TokenGroupMember
  chainIds: number[]
}): Promise<GetTokenGroupResponse | null> {
  try {
    return await client.getTokenGroup({
      selector: { case: 'member', value: { chainId: member.chainId, address: member.address } },
      chainIds,
    })
  } catch (error) {
    if (error instanceof ConnectError && error.code === Code.NotFound) {
      return null
    }
    throw error
  }
}

/**
 * The group a token belongs to plus every member, the subject included. No sparklines: the TDP
 * only renders card stats.
 */
export function getGetTokenGroupQueryOptions(
  client: DataApiServiceClientV2,
  { member, chainIds, enabled = true }: GetTokenGroupInput,
): QueryOptionsResult<GetTokenGroupResponse | null, Error, GetTokenGroupResponse | null, GetTokenGroupQueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getTokenGroup', member?.chainId, member?.address, chainIds] as const,
    queryFn: () => {
      if (!member) {
        throw new Error('member required')
      }
      return fetchTokenGroupByMember({ client, member, chainIds })
    },
    enabled: enabled && !!member && chainIds.length > 0,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
    retry: 2,
  })
}

export type ListTokenGroupsInput = {
  categoryId: string | undefined
  chainIds: number[]
  orderBy: TokensOrderBy
  ascending?: boolean
  /**
   * Server-side search over the category's groups (name, ticker, member name or symbol; a `0x` query matches
   * member addresses). Callers drop blank input so an empty search box shares the unsearched query.
   */
  searchQuery?: string
  enabled?: boolean
}

type ListTokenGroupsQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listTokenGroups',
  string | undefined,
  number[],
  TokensOrderBy,
  boolean,
  string | undefined,
]

/**
 * v2 ListTokenGroups: ranked groupings (all issuers' tokenizations of one underlying) for a grouped
 * category such as stocks/etfs/commodities.
 */
export function getListTokenGroupsInfiniteQueryOptions(
  client: DataApiServiceClientV2,
  { categoryId, chainIds, orderBy, ascending = false, searchQuery, enabled = true }: ListTokenGroupsInput,
): InfiniteQueryOptionsResult<
  ListTokenGroupsResponse,
  Error,
  InfiniteData<ListTokenGroupsResponse>,
  ListTokenGroupsQueryKey,
  string
> {
  return infiniteQueryOptions({
    queryKey: [
      ReactQueryCacheKey.DataApiService,
      'listTokenGroups',
      categoryId,
      chainIds,
      orderBy,
      ascending,
      searchQuery,
    ] as const,
    queryFn: ({ pageParam }) =>
      client.listTokenGroups({
        chainIds,
        filter: { categoryIds: categoryId ? [categoryId] : [], ...(searchQuery !== undefined && { searchQuery }) },
        sort: { orderBy, ascending },
        page: { pageSize: TOKEN_GROUPS_PAGE_SIZE, pageToken: pageParam },
        sparklineDuration: HistoryDuration.DAY,
      }),
    getNextPageParam: (lastPage: ListTokenGroupsResponse) => lastPage.page?.nextPageToken || undefined,
    initialPageParam: '',
    enabled: enabled && Boolean(categoryId) && chainIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
    retry: 2,
  })
}
