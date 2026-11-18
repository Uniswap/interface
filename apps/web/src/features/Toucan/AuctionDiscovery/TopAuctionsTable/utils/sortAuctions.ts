import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { approximateNumberFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import {
  AuctionSortField,
  type SortableTopAuctionTableValue,
} from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import {
  auctionCommittedVolumeComparator,
  compareDescendingMissingLast,
} from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import {
  getAuctionLaunchThresholdTokenAmount,
  getAuctionLaunchThresholdUsd,
} from '~/features/Toucan/utils/auctionFdvWarning'

/** FDV in bid-token units; `raw` 0n means "no data" (see computeProjectedFdvTableValue fallback). */
function getFdvBidTokenValue({ auction, projectedFdv }: SortableTopAuctionTableValue): number | undefined {
  const decimals = auction.auction?.currencyTokenDecimals
  if (projectedFdv.raw === 0n || !decimals) {
    return undefined
  }
  return approximateNumberFromRaw({ raw: projectedFdv.raw, decimals })
}

/** Groups for the TIME_REMAINING sort, in descending-sort order. Inverted for ascending. */
const TIME_REMAINING_GROUP = { ongoing: 0, upcoming: 1, completed: 2 } as const

export function isUpcomingAuction(auction: EnrichedAuction, currentTimeMs: number): boolean {
  const { isCompleted, startBlockTimestamp } = auction.timeRemaining
  return (
    !isCompleted && startBlockTimestamp !== undefined && currentTimeMs < Number(startBlockTimestamp) * ONE_SECOND_MS
  )
}

function getTimeRemainingSortGroup({ auction }: SortableTopAuctionTableValue, currentTimeMs: number): number {
  if (auction.timeRemaining.isCompleted) {
    return TIME_REMAINING_GROUP.completed
  }
  return isUpcomingAuction(auction, currentTimeMs) ? TIME_REMAINING_GROUP.upcoming : TIME_REMAINING_GROUP.ongoing
}

// Upcoming cells display time-to-start, so they sort on start; ongoing/completed cells on end.
function getTimeRemainingSortKey({ auction }: SortableTopAuctionTableValue, group: number): bigint | undefined {
  return group === TIME_REMAINING_GROUP.upcoming
    ? auction.timeRemaining.startBlockTimestamp
    : auction.timeRemaining.endBlockTimestamp
}

/**
 * Comparator functions for client-side auction sorting.
 * Default behavior: descending order (higher values first), missing values sort to the end.
 * USD values compare cross-currency; rows without USD fall back to bid-token amounts.
 */
const AuctionSortMethods: Record<
  AuctionSortField,
  // oxlint-disable-next-line max-params -- sort comparators conventionally take (a, b, direction)
  (
    a: SortableTopAuctionTableValue,
    b: SortableTopAuctionTableValue,
    sortAscending?: boolean,
    currentTimeMs?: number,
  ) => number
> = {
  [AuctionSortField.FDV]: (a, b) => {
    // USD when both sides have it (cross-currency comparison); otherwise fall back to the
    // bid-token FDV so chains without a USD price feed (e.g. Robinhood) still sort.
    if (a.projectedFdv.usd !== undefined && b.projectedFdv.usd !== undefined) {
      return b.projectedFdv.usd - a.projectedFdv.usd
    }
    return compareDescendingMissingLast(getFdvBidTokenValue(a), getFdvBidTokenValue(b))
  },

  [AuctionSortField.COMMITTED_VOLUME]: (a, b) => {
    return auctionCommittedVolumeComparator(a.auction, b.auction)
  },

  [AuctionSortField.LAUNCH_THRESHOLD]: (a, b) => {
    // USD when both sides have it (cross-currency comparison); otherwise fall back to the
    // bid-token threshold so chains without a USD price feed (e.g. Robinhood) still sort.
    const aUsd = getAuctionLaunchThresholdUsd(a.auction.auction)
    const bUsd = getAuctionLaunchThresholdUsd(b.auction.auction)
    if (aUsd !== undefined && bUsd !== undefined) {
      return bUsd - aUsd
    }
    return compareDescendingMissingLast(
      getAuctionLaunchThresholdTokenAmount(a.auction.auction),
      getAuctionLaunchThresholdTokenAmount(b.auction.auction),
    )
  },

  // Sorting by time remaining groups ongoing → upcoming → completed (inverted for ascending),
  // then orders within each group by the timestamp its cell counts against.

  // oxlint-disable-next-line max-params -- sort comparators conventionally take (a, b, direction)
  [AuctionSortField.TIME_REMAINING]: (a, b, sortAscending = false, currentTimeMs = Date.now()) => {
    const aGroup = getTimeRemainingSortGroup(a, currentTimeMs)
    const bGroup = getTimeRemainingSortGroup(b, currentTimeMs)
    if (aGroup !== bGroup) {
      return sortAscending ? bGroup - aGroup : aGroup - bGroup
    }

    const aKey = getTimeRemainingSortKey(a, aGroup)
    const bKey = getTimeRemainingSortKey(b, bGroup)

    // No data sorts to the end of its group
    if (aKey === undefined) {
      return 1
    }
    if (bKey === undefined) {
      return -1
    }

    return sortAscending ? Number(bKey) - Number(aKey) : Number(aKey) - Number(bKey)
  },
}

/**
 * Sorts auctions using the specified sort method.
 * @param auctions - Array of auctions to sort
 * @param sortMethod - The sorting method to use
 * @param sortAscending - Whether to sort in ascending order
 * @returns Sorted array of auctions
 */
export function sortAuctions<TAuction extends SortableTopAuctionTableValue>({
  auctions,
  sortMethod,
  sortAscending,
  currentTimeMs = Date.now(),
}: {
  auctions: TAuction[]
  sortMethod: AuctionSortField
  sortAscending: boolean
  currentTimeMs?: number
}): TAuction[] {
  // For TIME_REMAINING, pass sortAscending to enable custom sorting logic
  // For other fields, use reverse() approach
  if (sortMethod === AuctionSortField.TIME_REMAINING) {
    // Snapshot the clock once so the phase grouping stays consistent across the whole sort
    return [...auctions].sort((a, b) => AuctionSortMethods[sortMethod](a, b, sortAscending, currentTimeMs))
  }

  const sorted = [...auctions].sort(AuctionSortMethods[sortMethod])
  return sortAscending ? sorted.reverse() : sorted
}
