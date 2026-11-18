import { queryOptions } from '@tanstack/react-query'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'

export const RELATED_TOKENS_MAX_COUNT = 16

export type RelatedTokensInput = {
  categoryId: string | undefined
  chainIds: number[]
  enabled?: boolean
}

type RelatedTokensQueryKey = readonly [
  ReactQueryCacheKey.DataApiService,
  'listTokens',
  'relatedTokens',
  string | undefined,
  number[],
]

/**
 * Tokens in `categoryId` for the TDP related-tokens section.
 *
 * Backed by ListTokens with the `category_ids` filter (the GetRelatedTokens RPC was never built).
 * BE accepts the filter but doesn't apply it yet, so results mirror the unfiltered volume ranking
 * until serving lands; nothing here changes when it does.
 */
export function getRelatedTokensQueryOptions(
  client: DataApiServiceClientV2,
  { categoryId, chainIds, enabled = true }: RelatedTokensInput,
): QueryOptionsResult<ListTokensResponse, Error, ListTokensResponse, RelatedTokensQueryKey> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listTokens', 'relatedTokens', categoryId, chainIds] as const,
    queryFn: () =>
      client.listTokens({
        chainIds,
        // +1 so dropping the subject token can still fill the cap.
        page: { pageSize: RELATED_TOKENS_MAX_COUNT + 1 },
        sort: { orderBy: TokensOrderBy.VOLUME_1D, ascending: false },
        sparklineDuration: HistoryDuration.DAY,
        filter: { categoryIds: categoryId ? [categoryId] : [], applyTopLevelFilters: true },
      }),
    enabled: enabled && categoryId !== undefined,
    staleTime: ONE_MINUTE_MS,
    retry: 2,
  })
}
