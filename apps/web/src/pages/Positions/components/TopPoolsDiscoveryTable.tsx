import { Flex } from '@universe/mycelium'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { OrderDirection } from '~/data/util'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { useExploreQueryLatencyTracking } from '~/features/Explore/state/useExploreQueryLatencyTracking'
import { useV2ListPools } from '~/features/Liquidity/hooks/useV2ListPools'
import { PoolsTable } from '~/features/Liquidity/PoolsTable/PoolsTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/features/Liquidity/PoolsTable/state/poolTableStore'
import { getPoolSortMethodForPeriod } from '~/features/Liquidity/PoolsTable/utils/poolVolumePeriods'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/** A fixed set of the top-ranked pools for the empty Positions page: no infinite scroll and no volume period. */
export function TopPoolsDiscoveryTable({ rowCount }: { rowCount: number }): JSX.Element {
  return (
    <PoolTableStoreContextProvider>
      <TopPoolsDiscoveryTableContent rowCount={rowCount} />
    </PoolTableStoreContextProvider>
  )
}

function TopPoolsDiscoveryTableContent({ rowCount }: { rowCount: number }): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const poolsFilter = useExploreTablesFilterStore((s) => s.poolsFilter)
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  const {
    pools,
    isLoading,
    isError,
    chainId: listChainId,
  } = useV2ListPools({
    sortState: {
      sortBy: getPoolSortMethodForPeriod(sortMethod, undefined),
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
    chainId,
    poolsFilter,
    filterString,
  })
  // Same query and latency report Explore's ranked pools table makes, so the two share a cache entry.
  useExploreQueryLatencyTracking({ queryType: 'pools', isLoading, resultCount: pools?.length, chainId })

  return (
    // `width` is load-bearing: auto inline margins stop a flex item stretching, so without a definite
    // width the table collapses to fit-content and overflows its container below 900px.
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" my={0} data-testid="top-pools-explore-table">
      <PoolsTable
        mobileFullBleed
        pools={pools?.slice(0, rowCount)}
        loading={isLoading}
        error={isError}
        maxWidth={1200}
        chainId={listChainId}
        surface="positions-discovery"
        filterString={filterString}
        virtualized={false}
      />
    </Flex>
  )
}
