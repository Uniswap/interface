import { AuctionStatusFilter } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'utilities/src/time/timing'
import { Table } from '~/components/Table'
import { useAuctionTableSort } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/hooks/useAuctionTableSort'
import { useTopAuctionsTableColumns } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/hooks/useTopAuctionsTableColumns'
import { useTopAuctionsTableRows } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/hooks/useTopAuctionsTableRows'
import type { AuctionLaunchpadDisplay } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import { filterAuctions } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/utils/filterAuctions'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { useSearchedAuctions } from '~/features/Toucan/hooks/useTopAuctions/useSearchedAuctions'
import { useTopAuctions } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { AuctionQuickFilter, AuctionStatus } from '~/types/auctionFilters'
import { toSearchQueryParam } from '~/utils/listRequestParams'

// Legacy `m: '0 auto'` expanded to per-side `margin-top: 0 auto` etc. — invalid CSS the browser
// drops — so no margin ever rendered; only the max-width (MAX_WIDTH_MEDIA_BREAKPOINT) carries over.
const TableWrapper = styled(Flex, {
  base: 'max-w-[1200px]',
})

/** Fits TokenNameCell's stacked name + symbol, matching the Tokens table. */
const COMPACT_ROW_HEIGHT = 64

const AUCTION_STATUS_TO_FILTER: Record<AuctionStatus, AuctionStatusFilter | undefined> = {
  [AuctionStatus.All]: undefined,
  [AuctionStatus.Active]: AuctionStatusFilter.LIVE,
  [AuctionStatus.Upcoming]: AuctionStatusFilter.UPCOMING,
  [AuctionStatus.Launched]: AuctionStatusFilter.GRADUATED,
  [AuctionStatus.Failed]: AuctionStatusFilter.FAILED,
}

export const ToucanTable = memo(function ToucanTable({
  chainId,
  liveOnly = false,
  customOnly,
  pageSize,
  launchpad,
  filterString = '',
  quickFilter,
  status: selectedStatus = AuctionStatus.All,
  onSort,
}: {
  /** Override the URL-derived chain (used off /explore, e.g. the /launches Live-auctions view). */
  chainId?: UniverseChainId
  /** Server-side: keep only in-progress + upcoming auctions, dropping ones past their end block. */
  liveOnly?: boolean
  customOnly?: boolean
  /** Override the ListTopAuctions page size (defaults to the Explore-wide AUCTION_LIST_API_PAGE_SIZE). */
  pageSize?: number
  /**
   * When set, renders a Launchpad column after the token column. Every Toucan auction is a Uniswap
   * CCA auction, so the caller resolves the single launchpad once (registry logo + name) rather
   * than per row — the /launches Live-auctions view passes the `uniswap-cca` registry entry.
   */
  launchpad?: AuctionLaunchpadDisplay
  /** The search box value, from whichever filter store the surface keeps; Launches has no search box. */
  filterString?: string
  quickFilter: AuctionQuickFilter
  status?: AuctionStatus
  /** Runs after a header sort, e.g. Explore scrolling back up to its table section. */
  onSort?: () => void
}) {
  const searchQuery = toSearchQueryParam(useDebounce(filterString, 300))
  // liveOnly views have no status dropdown to reset a stored status.
  const status = liveOnly ? AuctionStatus.All : selectedStatus
  const statusFilter = AUCTION_STATUS_TO_FILTER[status]

  const topAuctions = useTopAuctions({ chainId, liveOnly, customOnly, statusFilter, pageSize, enabled: !searchQuery })
  const searchedAuctions = useSearchedAuctions({ searchQuery, chainId, liveOnly, statusFilter })
  const { auctions, isLoading, isError } = searchQuery ? searchedAuctions : topAuctions

  // Server pages arrive bucketed by status; the verified fallback and search rows do not, so match client-side.
  const filteredAuctions = useMemo(
    () => filterAuctions({ auctions, quickFilter, status, liveOnly }),
    [auctions, quickFilter, status, liveOnly],
  )

  return (
    <TableWrapper
      testID="toucan-explore-table"
      // With this subtree scroll-anchorable, Chrome shifted the window on each appended page, which
      // re-armed load-more and chained page fetches.
      style={{ overflowAnchor: 'none' }}
    >
      <ToucanTableComponent
        auctions={filteredAuctions}
        loading={isLoading}
        loadMore={searchQuery ? undefined : topAuctions.loadMore}
        error={isError}
        launchpad={launchpad}
        status={status}
        onSort={onSort}
      />
    </TableWrapper>
  )
})

function ToucanTableComponent({
  auctions,
  loading,
  error,
  loadMore,
  launchpad,
  status,
  onSort,
}: {
  auctions?: readonly EnrichedAuction[]
  loading: boolean
  error?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  launchpad?: AuctionLaunchpadDisplay
  status: AuctionStatus
  onSort?: () => void
}) {
  const { t } = useTranslation()
  const media = useMedia()
  // Launch threshold isn't meaningful once every visible auction has already resolved.
  const isCompletedOnlyView = status === AuctionStatus.Launched || status === AuctionStatus.Failed
  const { sortMethod, sortAscending, orderDirection, createSortHandler } = useAuctionTableSort(onSort)
  const { visibleRows, hiddenRows } = useTopAuctionsTableRows({ auctions, sortMethod, sortAscending })

  // Show skeleton while auctions are loading
  const showLoadingSkeleton = loading || !!error
  const columns = useTopAuctionsTableColumns({
    showLoadingSkeleton,
    launchpad,
    isCompletedOnlyView,
    sortMethod,
    orderDirection,
    createSortHandler,
  })

  return (
    <Flex gap="$spacing12">
      <Table
        mobileFullBleed
        virtualized
        columns={columns}
        data={visibleRows}
        loading={loading}
        error={error}
        loadMore={loadMore}
        maxWidth={1200}
        defaultPinnedColumns={['tokenName']}
        compactRowHeight={COMPACT_ROW_HEIGHT}
        hiddenRows={hiddenRows}
        showHiddenRowsLabel={t('toucan.auction.showHiddenAuctions')}
        hideHiddenRowsLabel={t('toucan.auction.hideHiddenAuctions')}
        collapsiblePinnedColumnId={media.lg ? 'tokenName' : undefined}
      />
      <Flex justifyContent="center" alignItems="center">
        <Text lineHeight={12} flex={1} width="75%" color="$neutral3" textAlign="center" variant="body4">
          {t('toucan.auction.disclaimer')}
        </Text>
      </Flex>
    </Flex>
  )
}
