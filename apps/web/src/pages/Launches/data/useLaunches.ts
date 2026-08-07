import type { PlainMessage } from '@bufbuild/protobuf'
import { useInfiniteQuery } from '@tanstack/react-query'
import { LaunchesOrderBy, LaunchWindow, type Launch } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  getListLaunchesQueryOptions,
  type ListLaunchesParams,
} from 'uniswap/src/data/apiClients/dataApiService/launches/queries'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'

export const LAUNCHES_API_PAGE_SIZE = 25

export interface UseLaunchesOptions {
  /** Restrict to a single launchpad (slug from useLaunchpads). Omit for all launchpads. */
  launchpadId?: string
  /** Restrict to one or more launchpads (slugs from useLaunchpads). Omit or pass [] for all launchpads. */
  launchpadIds?: string[]
  /** Restrict to specific chains. Omit or pass [] for all supported chains. */
  chainIds?: UniverseChainId[]
  /** Server-side sort. Defaults to newest first (LAUNCHED_AT). */
  sortBy?: LaunchesOrderBy
  /** Sort direction for `sortBy`; false (default) = descending (highest first). */
  ascending?: boolean
  /** Restrict to a launch-recency window (e.g. LAST_24H). Omit for all launches. */
  window?: LaunchWindow
  pageSize?: number
}

/**
 * Paged launches feed for the launchpad-aggregator Launches surface (data-api v2 ListLaunches).
 * Filtering (launchpad + chains) and sorting are server-side; pagination is an infinite query
 * keyed by the request, so changing a filter or sort restarts from the first page.
 */
export function useLaunches({
  launchpadId,
  launchpadIds,
  chainIds,
  sortBy = LaunchesOrderBy.LAUNCHED_AT,
  ascending = false,
  window,
  pageSize = LAUNCHES_API_PAGE_SIZE,
}: UseLaunchesOptions = {}): {
  launches: PlainMessage<Launch>[]
  /** The most recently fetched page's launches (the tail of `launches`), for page-level checks. */
  lastPageLaunches: PlainMessage<Launch>[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  hasNextPage: boolean
  isFetchingNextPage: boolean
  loadMore: () => Promise<void>
} {
  // Built inline: React Query hashes the query key by value, so a fresh array/object each render
  // maps to the same query — no need to stabilize references. Empty arrays = all launchpads/chains.
  const params: ListLaunchesParams = {
    launchpadId,
    launchpadIds: launchpadIds ?? [],
    chainIds: chainIds ?? [],
    sortBy,
    ascending,
    filter: window === undefined ? undefined : { window },
    pageSize,
  }

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    ...getListLaunchesQueryOptions({ params }),
    // Backend serves live price/FDV per request — poll (TDP price cadence) so an open list stays fresh.
    // Refetch re-walks loaded pages sequentially with fresh cursors; paused while the tab is unfocused.
    refetchInterval: PollingInterval.KindaFast,
  })

  const launches = useMemo<PlainMessage<Launch>[]>(
    () => data?.pages.flatMap((page) => page.launches) ?? [],
    [data?.pages],
  )
  const lastPageLaunches = useMemo<PlainMessage<Launch>[]>(() => data?.pages.at(-1)?.launches ?? [], [data?.pages])

  const loadMore = useEvent(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage()
    }
  })

  return { launches, lastPageLaunches, isLoading, isError, error, hasNextPage, isFetchingNextPage, loadMore }
}
