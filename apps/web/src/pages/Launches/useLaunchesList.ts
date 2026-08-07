import { LaunchesOrderBy, LaunchWindow } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useCallback, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/** Quick-select category chips on the All-Launches header row. */
export enum LaunchQuickFilter {
  All = 'all',
  Trending = 'trending',
  RecentlyLaunched = 'recentlyLaunched',
}

/**
 * Server-side launch-recency window per quick-select: All is unwindowed, Trending the last 24h,
 * Recently launched the last 1h. The Trending window only reaches the wire when the user re-sorts
 * the category by another column — the TRENDING sort itself takes no window (see
 * toLaunchesRequestParams): it ranks on momentum regardless of launch age.
 */
const QUICK_FILTER_WINDOW: Record<LaunchQuickFilter, LaunchWindow | undefined> = {
  [LaunchQuickFilter.All]: undefined,
  [LaunchQuickFilter.Trending]: LaunchWindow.LAST_24H,
  [LaunchQuickFilter.RecentlyLaunched]: LaunchWindow.LAST_1H,
}

/** Default table order: highest 24h volume first (server-ranked). */
export const DEFAULT_LAUNCHES_SORT = LaunchesOrderBy.VOLUME_1D

/**
 * Default order per category. Trending is its own server-side ranking — gated on FDV, 1h price
 * change and distinct 1h buyers, then scored by volume + buyer acceleration — so it needs no
 * client-side cutoff. Every other category keeps the 24h-volume default.
 */
const DEFAULT_SORT_BY_CATEGORY: Record<LaunchQuickFilter, LaunchesOrderBy> = {
  [LaunchQuickFilter.All]: DEFAULT_LAUNCHES_SORT,
  [LaunchQuickFilter.Trending]: LaunchesOrderBy.TRENDING,
  [LaunchQuickFilter.RecentlyLaunched]: DEFAULT_LAUNCHES_SORT,
}

/** One category's sort selection, tracked per quick-select so switching chips preserves each re-sort. */
interface LaunchesSortState {
  sortBy: LaunchesOrderBy
  /** Sort direction for `sortBy`; false = descending (highest first, the default). */
  ascending: boolean
}

function defaultSortState(filter: LaunchQuickFilter): LaunchesSortState {
  return { sortBy: DEFAULT_SORT_BY_CATEGORY[filter], ascending: false }
}

export interface LaunchesFilterState {
  sources: Set<string>
  networkChainId: UniverseChainId | undefined
  quickFilter: LaunchQuickFilter
  sortBy: LaunchesOrderBy
  /** Sort direction for `sortBy`; false = descending (highest first, the default). */
  ascending: boolean
  setQuickFilter: (filter: LaunchQuickFilter) => void
  /** Select a sort column; re-selecting the active column flips direction, a new column resets to descending. */
  onSortChange: (sortBy: LaunchesOrderBy) => void
  /** Restore a category's default sort (descending), discarding any user re-sort. */
  resetCategorySort: (filter: LaunchQuickFilter) => void
  toggleSource: (launchpadId: string) => void
  clearSources: () => void
  setNetworkChainId: (chainId: UniverseChainId | undefined) => void
}

/**
 * Owns the All-Launches filter state. Launchpad, chain, sort, and the quick-select recency window
 * are all applied server-side (see toLaunchesRequestParams and useLaunches); each category carries
 * its own default sort (TRENDING for the Trending chip, VOLUME_1D elsewhere). The server ranks
 * every sort dimension (TRENDING, VOLUME_1D, TVL, price change, LAUNCHED_AT) with a materialized
 * tail, so the infinite-scroll table renders the server order directly.
 */
export function useLaunchesFilters(): LaunchesFilterState {
  const [sources, setSources] = useState<Set<string>>(new Set())
  const [networkChainId, setNetworkChainId] = useState<UniverseChainId | undefined>(undefined)
  const [quickFilter, setQuickFilter] = useState<LaunchQuickFilter>(LaunchQuickFilter.All)
  const [sortByCategory, setSortByCategory] = useState<Partial<Record<LaunchQuickFilter, LaunchesSortState>>>({})
  const sort = sortByCategory[quickFilter] ?? defaultSortState(quickFilter)

  const onSortChange = useCallback(
    (sortBy: LaunchesOrderBy) => {
      setSortByCategory((prev) => {
        const current = prev[quickFilter] ?? defaultSortState(quickFilter)
        return {
          ...prev,
          [quickFilter]:
            current.sortBy === sortBy ? { sortBy, ascending: !current.ascending } : { sortBy, ascending: false },
        }
      })
    },
    [quickFilter],
  )

  const resetCategorySort = useCallback((filter: LaunchQuickFilter) => {
    setSortByCategory((prev) => {
      if (prev[filter] === undefined) {
        return prev
      }
      const next = { ...prev }
      delete next[filter]
      return next
    })
  }, [])

  const toggleSource = useCallback((launchpadId: string) => {
    setSources((prev) => {
      const next = new Set(prev)
      if (next.has(launchpadId)) {
        next.delete(launchpadId)
      } else {
        next.add(launchpadId)
      }
      return next
    })
  }, [])

  const clearSources = useCallback(() => setSources(new Set()), [])

  return {
    sources,
    networkChainId,
    quickFilter,
    sortBy: sort.sortBy,
    ascending: sort.ascending,
    setQuickFilter,
    onSortChange,
    resetCategorySort,
    toggleSource,
    clearSources,
    setNetworkChainId,
  }
}

export interface LaunchesRequestParams {
  launchpadIds: string[] | undefined
  chainIds: UniverseChainId[] | undefined
  sortBy: LaunchesOrderBy
  ascending: boolean
  window: LaunchWindow | undefined
}

/**
 * Server-side ListLaunches params from the active filters: launchpad + chain filters, the chosen
 * sort, and the quick-select recency window. The server ranks the requested metric and pushes empty
 * rows into a materialized tail, so ordering + windowing are authoritative across the whole paged
 * feed (not just loaded pages).
 */
export function toLaunchesRequestParams({
  sources,
  networkChainId,
  sortBy,
  ascending,
  quickFilter,
  allowedChainIds,
}: Pick<LaunchesFilterState, 'sources' | 'networkChainId' | 'sortBy' | 'ascending' | 'quickFilter'> & {
  /** Chains the surface is scoped to (Statsig-driven); used when no explicit network is selected. */
  allowedChainIds?: UniverseChainId[]
}): LaunchesRequestParams {
  return {
    launchpadIds: sources.size ? [...sources] : undefined,
    chainIds: networkChainId === undefined ? allowedChainIds : [networkChainId],
    sortBy,
    ascending,
    // TRENDING ranks on momentum regardless of launch age, so it takes no recency window. The
    // category window applies under every other sort (e.g. a user re-sort of the Trending chip).
    window: sortBy === LaunchesOrderBy.TRENDING ? undefined : QUICK_FILTER_WINDOW[quickFilter],
  }
}
