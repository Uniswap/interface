import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { PoolTableSortState } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { EXPLORE_API_PAGE_SIZE } from '~/features/Explore/state/constants'
import { toSearchQueryParam } from '~/features/Explore/utils/toSearchQueryParam'
import { toPoolsFilterRequestParams } from '~/features/Liquidity/PoolsFilter/toRequest'
import { poolSortFieldToOrderBy } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import { getPoolsListParams, resolvePoolsListChainId } from '~/features/Liquidity/utils/getPoolsListParams'
import { useInfiniteLoadMore } from '~/hooks/useInfiniteLoadMore'
import { useListPoolsAsPoolStats } from '~/pages/Explore/hooks/useListPoolsAsPoolStats'
import type { PoolStat } from '~/types/explore'
import type { PoolsFilterState } from '~/types/poolsFilter'

/**
 * The ranked, filterable data.v2 `ListPools` list behind both the Explore pools tab and the
 * add-liquidity pool browser. Sorting, search, the advanced protocol/TVL/APR/rewards filters and pagination are all handled by the backend.
 *
 * The two surfaces differ only in where their filter values live — Explore in its tables filter
 * store, the browser in URL params — so this hook takes them as arguments and reads no store of its
 * own. Passing `currencies` additionally scopes the list to one selected token (matching either side)
 * or a pair (matching that exact pair), which is what the browser's token selectors do.
 */
export function useV2ListPools({
  sortState,
  chainId,
  poolsFilter,
  currency0,
  currency1,
  filterString,
}: {
  sortState: PoolTableSortState
  chainId?: UniverseChainId
  /** Advanced pools filter; when set, drives chain/protocol/stats filters. */
  poolsFilter?: PoolsFilterState
  /** Scopes the list to this token. Token addresses are chain-specific, so this pins the list to one chain. */
  currency0?: Currency
  /** With `currency0`, narrows the list to that exact pair rather than either side. */
  currency1?: Currency
  /** Search box value, sent as the ListPools `searchQuery`. */
  filterString: string
}): {
  pools: PoolStat[] | undefined
  isLoading: boolean
  isError: boolean
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** The one chain the list is filtered to; undefined for all networks. */
  chainId?: UniverseChainId
} {
  const enabledChains = useEnabledChains()

  // The advanced filter (when present) supplies chain, protocol and TVL/APR stats filters.
  const filterParams = useMemo(() => (poolsFilter ? toPoolsFilterRequestParams(poolsFilter) : undefined), [poolsFilter])

  const effectiveChainId = resolvePoolsListChainId({
    filterChainId: filterParams?.chainId,
    chainId,
    currencies: [currency0, currency1],
  })

  const orderBy = poolSortFieldToOrderBy[sortState.sortBy]
  const ascending = sortState.sortDirection === OrderDirection.Asc
  const searchQuery = toSearchQueryParam(filterString)

  const params = useMemo(
    () =>
      getPoolsListParams({
        chainId: effectiveChainId,
        fallbackChainIds: enabledChains.chains,
        sort: { orderBy, ascending },
        filterParams,
        currencies: [currency0, currency1],
        searchQuery,
      }),
    [effectiveChainId, enabledChains.chains, orderBy, ascending, filterParams, currency0, currency1, searchQuery],
  )

  const hasTokenFilter = Boolean(currency0 || currency1)

  const { pools, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useListPoolsAsPoolStats({
    params,
    pageSize: EXPLORE_API_PAGE_SIZE,
    // A token filter with no chain to apply it on would silently widen to a chain-wide list.
    enabled: !hasTokenFilter || effectiveChainId !== undefined,
    // Searched pages stay off disk: a return visit re-fetches them anyway (per-keystroke keys are
    // almost never hit again), and every page persisted is ~100 pools of localStorage that the
    // unsearched tables' instant repaint has to share. The BE skips its own caches for them for
    // the same reason.
    persist: searchQuery === undefined,
  })

  const loadMore = useInfiniteLoadMore({ fetchNextPage, hasNextPage, isFetchingNextPage })

  return {
    pools,
    isLoading,
    isError,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    chainId: effectiveChainId,
  }
}
