import { useCallback, useMemo } from 'react'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import { useListPoolCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListPoolCategoriesQuery'
import type { Category, CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { isCategoryUnsupportedChain } from '~/pages/Explore/categories/useExploreCategory'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** A category's member count and 24h change: tokens show price change, pools TVL change. */
export interface CategoryRowStats {
  count: number
  change24hPct: number | undefined
}

const EMPTY_ROW_STATS: CategoryRowStats = { count: 0, change24hPct: 0 }

function toRowStats(category: Category): CategoryRowStats | undefined {
  if (!category.stats) {
    return undefined
  }
  return category.kind === 'pool'
    ? { count: category.stats.poolCount, change24hPct: category.stats.tvlChange24hPct }
    : { count: category.stats.tokenCount, change24hPct: category.stats.priceChange24hPct }
}

export function isEmptyCategoryStats(stats: CategoryRowStats | undefined): boolean {
  return stats?.count === 0
}

/**
 * Category stats scoped to the Explore network filter; empty on those chains reads as zeroed stats.
 * A chain without category coverage shows All networks stats, since picking a category there resets the filter.
 */
export function useNetworkScopedCategoryStats(kind: CategoryKind): {
  getScopedStats: (category: Category) => CategoryRowStats | undefined
  isCategoryEmpty: (category: Category) => boolean
  /** Only while an uncached network's first attempt is in flight. */
  scopedStatsPending: boolean
} {
  const chainId = useChainIdFromUrlParam()
  const chainIds = useMemo(() => (chainId && !isCategoryUnsupportedChain(chainId) ? [chainId] : undefined), [chainId])
  const tokenQuery = useListCategoriesQuery({ chainIds, enabled: kind === 'token' })
  const poolQuery = useListPoolCategoriesQuery({ chainIds, enabled: kind === 'pool' })
  const {
    data: scopedCategories,
    isPlaceholderData,
    isFetching,
    failureCount,
  } = kind === 'pool' ? poolQuery : tokenQuery
  // Retries fall back to All networks stats rather than holding the skeleton through the backoff.
  const scopedStatsPending = (scopedCategories === undefined || isPlaceholderData) && isFetching && failureCount === 0

  const getScopedStats = useMemo(() => {
    // keepPreviousData serves the prior chain's stats on a network switch; fall back until the scoped
    // response lands so a category empty on the previous chain isn't wrongly hidden or disabled on this one.
    if (!scopedCategories || isPlaceholderData) {
      return toRowStats
    }
    const scopedStatsById = new Map(scopedCategories.map((category) => [category.id, toRowStats(category)]))
    return (category: Category) => scopedStatsById.get(category.id) ?? EMPTY_ROW_STATS
  }, [scopedCategories, isPlaceholderData])

  const isCategoryEmpty = useCallback(
    (category: Category) => isEmptyCategoryStats(getScopedStats(category)),
    [getScopedStats],
  )

  return { getScopedStats, isCategoryEmpty, scopedStatsPending }
}
