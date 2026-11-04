import {
  type DataTag,
  queryOptions,
  skipToken,
  type UndefinedInitialDataOptions,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { UseQueryApiHelperHookArgs } from '@universe/api'
import {
  MarginApiClient,
  type MarginPositionActivity,
  type MarginPositionsRequest,
  type MarginPositionsResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

// The key PREFIX, owned here rather than retyped at each invalidation site: six call sites across the
// margin feature invalidate this query, and a literal in each is a rename away from silently breaking
// every one of them.
export const MARGIN_POSITIONS_QUERY_KEY = [ReactQueryCacheKey.TradingApi, 'margin/positions'] as const

// Under the positions prefix, so every positions invalidation (a plan landing) refetches the events too.
export const MARGIN_POSITION_ACTIVITY_QUERY_KEY = [...MARGIN_POSITIONS_QUERY_KEY, 'activity'] as const

type MarginPositionActivityQueryKey = [...typeof MARGIN_POSITION_ACTIVITY_QUERY_KEY, string | undefined]

// The drawer and the chart markers both read this cache entry; one factory keeps their fetch identical.
export function marginPositionActivityQueryOptions(activityId: string | undefined): UndefinedInitialDataOptions<
  MarginPositionActivity[],
  Error,
  MarginPositionActivity[],
  MarginPositionActivityQueryKey
> & {
  queryKey: DataTag<MarginPositionActivityQueryKey, MarginPositionActivity[], Error>
} {
  return queryOptions({
    queryKey: [...MARGIN_POSITION_ACTIVITY_QUERY_KEY, activityId],
    queryFn: activityId
      ? async (): Promise<MarginPositionActivity[]> => await MarginApiClient.fetchMarginPositionActivity({ activityId })
      : skipToken,
  })
}

export function useMarginPositionsQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  MarginPositionsRequest,
  MarginPositionsResponse
>): UseQueryResult<MarginPositionsResponse> {
  return useQuery<MarginPositionsResponse>({
    queryKey: [...MARGIN_POSITIONS_QUERY_KEY, params],
    queryFn: params
      ? async (): Promise<MarginPositionsResponse> => await MarginApiClient.fetchMarginPositions(params)
      : skipToken,
    ...rest,
  })
}
