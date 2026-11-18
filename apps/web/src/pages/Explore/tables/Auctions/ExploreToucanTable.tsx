import { memo } from 'react'
import { scrollToExploreTokenSection } from '~/features/Explore/categories/useExploreCategory'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { ToucanTable } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/TopAuctionsTable'

/** Explore's Auctions tab lists only auctions launched from the Uniswap interface. */
export const ExploreToucanTable = memo(function ExploreToucanTable(): JSX.Element {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const statusFilter = useExploreTablesFilterStore((s) => s.statusFilter)
  return (
    <ToucanTable
      customOnly
      filterString={filterString}
      quickFilter={quickFilter}
      status={statusFilter}
      onSort={scrollToExploreTokenSection}
    />
  )
})
