import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, memo, type RefAttributes, useEffect } from 'react'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import { LIVE_POOL_VOLUME_PERIODS, type LivePoolVolumePeriod } from '~/components/Charts/timeLabels'
import { useSimplePagination } from '~/components/Table/hooks/useSimplePagination'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { OrderDirection } from '~/data/util'
import { scrollToExploreTokenSection } from '~/features/Explore/categories/useExploreCategory'
import { useEffectiveVolumeTimePeriod } from '~/features/Explore/hooks/useEffectiveVolumeTimePeriod'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { usePoolsAprRange } from '~/features/Liquidity/PoolsFilter/aprRange'
import { PoolsTable } from '~/features/Liquidity/PoolsTable/PoolsTable'
import {
  PoolTableStoreContextProvider,
  usePoolTableStore,
  usePoolTableStoreActions,
} from '~/features/Liquidity/PoolsTable/state/poolTableStore'
import { getPoolSortMethodForPeriod } from '~/features/Liquidity/PoolsTable/utils/poolVolumePeriods'
import { useListPools } from '~/pages/Explore/hooks/useListPools'
import { PoolStat } from '~/types/explore'
import { LIST_API_PAGE_SIZE } from '~/utils/listRequestParams'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
const TableWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function TableWrapper(props, ref) {
  // `width` is load-bearing: auto inline margins stop a flex item stretching, so without a definite
  // width the table collapses to fit-content and overflows its container below 900px.
  return <Flex ref={ref} width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" my={0} {...props} />
})

interface TopPoolTableProps {
  topPools?: PoolStat[]
  isLoading: boolean
  isError: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  virtualized?: boolean
  /** The one chain the list is filtered to — scopes the hook-registry fetch to it; `undefined` = all networks. */
  chainId: UniverseChainId | undefined
  /** The search behind these rows, for row impression analytics. */
  filterString?: string
}
function ExploreTopPoolTableContent({
  staticSize,
  pageSize,
  surface,
  categoryId,
  categoryUnverified = false,
}: {
  staticSize?: boolean
  pageSize?: number
  surface: ExploreTableSurface
  categoryId?: string
  categoryUnverified?: boolean
}): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const isHooksExploreEnabled = useFeatureFlag(FeatureFlags.HooksExplore)
  const effectiveVolumeTimePeriod = useEffectiveVolumeTimePeriod(LIVE_POOL_VOLUME_PERIODS)
  const volumeTimePeriod = isHooksExploreEnabled && surface === 'explore' ? effectiveVolumeTimePeriod : undefined
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const { resetSort } = usePoolTableStoreActions()
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const { setPoolsAprRange } = useExploreTablesFilterStoreActions()

  useEffect(() => {
    resetSort()
  }, [resetSort])

  const {
    pools,
    isLoading,
    isError,
    loadMore,
    chainId: listChainId,
  } = useListPools({
    sortState: {
      sortBy: getPoolSortMethodForPeriod(sortMethod, volumeTimePeriod),
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
    // The filter's Network control reads and writes this same URL path segment (see ExploreTableFilters),
    // so the two can't disagree.
    chainId,
    poolsFilter,
    categoryId,
  })

  // An unverified category may be a bogus slug the BE rejects or empties; keep the skeleton up until
  // ListCategories settles it, since a fallback to All is about to replace this table anyway.
  const holdUnverifiedResult = categoryUnverified && (isError || pools?.length === 0)

  // The toolbar's filter modal sits outside this table's sort store, so it can't run the same query; publish the
  // loaded rows' APR range for its placeholder hints instead. Cleared on unmount so a stale range never lingers.
  const aprRange = usePoolsAprRange(pools)
  useEffect(() => {
    setPoolsAprRange(aprRange)
    return () => setPoolsAprRange(undefined)
  }, [aprRange, setPoolsAprRange])

  return (
    <TopPoolTable
      topPoolData={{
        topPools: pools,
        isLoading: isLoading || holdUnverifiedResult,
        isError: isError && !categoryUnverified,
        loadMore,
        chainId: listChainId,
        virtualized: true,
        filterString,
      }}
      staticSize={staticSize}
      pageSize={pageSize}
      surface={surface}
      scopedCategoryId={categoryId}
      volumeTimePeriod={volumeTimePeriod}
    />
  )
}

export const ExploreTopPoolTable = memo(function ExploreTopPoolTable({
  staticSize,
  pageSize,
  surface,
  categoryId,
  categoryUnverified,
}: {
  // Render a fixed set of rows with no infinite scroll / internal scroll area (e.g. discovery surfaces).
  staticSize?: boolean
  pageSize?: number
  surface: ExploreTableSurface
  /** Pool category ListPools filter; undefined renders the unfiltered (All) list. */
  categoryId?: string
  /** The category id came from the URL and ListCategories hasn't confirmed it yet. */
  categoryUnverified?: boolean
}) {
  return (
    <PoolTableStoreContextProvider>
      <ExploreTopPoolTableContent
        staticSize={staticSize}
        pageSize={pageSize}
        surface={surface}
        categoryId={categoryId}
        categoryUnverified={categoryUnverified}
      />
    </PoolTableStoreContextProvider>
  )
})

const TopPoolTable = memo(function TopPoolTable({
  topPoolData,
  pageSize = LIST_API_PAGE_SIZE,
  staticSize = false,
  surface,
  scopedCategoryId,
  volumeTimePeriod,
}: {
  topPoolData: TopPoolTableProps
  volumeTimePeriod?: LivePoolVolumePeriod
  pageSize?: number
  staticSize?: boolean
  surface: ExploreTableSurface
  scopedCategoryId?: string
}) {
  const { topPools, isLoading, isError, loadMore: backendLoadMore, chainId, virtualized, filterString } = topPoolData

  // Fallback for legacy mode, where the backend gives no loadMore.
  const { page, loadMore: clientLoadMore } = useSimplePagination({ totalCount: topPools?.length, pageSize })

  const effectiveLoadMore = backendLoadMore ?? clientLoadMore
  const displayedPools = staticSize
    ? topPools?.slice(0, pageSize)
    : backendLoadMore
      ? topPools
      : topPools?.slice(0, page * pageSize)

  return (
    <TableWrapper data-testid="top-pools-explore-table">
      <PoolsTable
        mobileFullBleed
        pools={displayedPools}
        loading={isLoading}
        error={isError}
        loadMore={staticSize ? undefined : effectiveLoadMore}
        maxWidth={1200}
        chainId={chainId}
        surface={surface}
        scopedCategoryId={scopedCategoryId}
        filterString={filterString}
        volumeTimePeriod={volumeTimePeriod}
        onSort={scrollToExploreTokenSection}
        // A fixed-row discovery surface has nothing to virtualize.
        virtualized={staticSize ? false : virtualized}
      />
    </TableWrapper>
  )
})
