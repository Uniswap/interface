import { ONE_DAY_MS, ONE_HOUR_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { isAuctionFailed } from '~/features/Toucan/Auction/utils/isAuctionFailed'
import type { TopAuctionsTableValue } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import { isUpcomingAuction } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/utils/sortAuctions'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { AuctionQuickFilter, AuctionStatus } from '~/types/auctionFilters'

const NEW_AUCTION_MAX_AGE_MS = 7 * ONE_DAY_MS

function isFailedAuction({ timeRemaining, auction }: EnrichedAuction): boolean {
  return isAuctionFailed({
    phase: timeRemaining.isCompleted ? 'completed' : undefined,
    isGraduated: auction?.isGraduated,
    totalBidVolume: auction?.totalBidVolume,
    requiredCurrencyRaised: auction?.requiredCurrencyRaised,
  })
}

export function matchesAuctionStatus({
  auction: enrichedAuction,
  status,
  currentTimeMs,
}: {
  auction: EnrichedAuction
  status: AuctionStatus
  currentTimeMs: number
}): boolean {
  const { isCompleted } = enrichedAuction.timeRemaining
  switch (status) {
    case AuctionStatus.Active:
      return !isCompleted && !isUpcomingAuction(enrichedAuction, currentTimeMs)
    case AuctionStatus.Upcoming:
      return isUpcomingAuction(enrichedAuction, currentTimeMs)
    case AuctionStatus.Launched:
      return isCompleted && !isFailedAuction(enrichedAuction)
    case AuctionStatus.Failed:
      return isCompleted && isFailedAuction(enrichedAuction)
    case AuctionStatus.All:
    default:
      return true
  }
}

function matchesQuickFilter({
  auction: enrichedAuction,
  quickFilter,
  currentTimeMs,
}: {
  auction: EnrichedAuction
  quickFilter: AuctionQuickFilter
  currentTimeMs: number
}): boolean {
  switch (quickFilter) {
    case AuctionQuickFilter.Verified:
      return enrichedAuction.verified
    case AuctionQuickFilter.New: {
      const createdAt = enrichedAuction.auction?.createdAt
      const createdAtMs = createdAt ? Date.parse(createdAt) : NaN
      return Number.isFinite(createdAtMs) && currentTimeMs - createdAtMs <= NEW_AUCTION_MAX_AGE_MS
    }
    case AuctionQuickFilter.All:
    default:
      return true
  }
}

export function filterAuctions({
  auctions,
  quickFilter,
  status,
  liveOnly,
}: {
  auctions: readonly EnrichedAuction[]
  quickFilter: AuctionQuickFilter
  status: AuctionStatus
  liveOnly: boolean
}): EnrichedAuction[] {
  const currentTimeMs = Date.now()
  return auctions.filter(
    (auction) =>
      auction.auction !== undefined &&
      !(liveOnly && auction.timeRemaining.isCompleted) &&
      matchesQuickFilter({ auction, quickFilter, currentTimeMs }) &&
      matchesAuctionStatus({ auction, status, currentTimeMs }),
  )
}

/** Splits rows into the visible list and the rows behind the table's "show hidden" toggle, keeping sort order. */
export function partitionHiddenAuctions(rows: readonly TopAuctionsTableValue[]): {
  visible: TopAuctionsTableValue[]
  hidden: TopAuctionsTableValue[]
} {
  const visible: TopAuctionsTableValue[] = []
  const hidden: TopAuctionsTableValue[] = []

  rows.forEach((value) => {
    const auction = value.auction
    const isFlagged = auction.auction?.isFlagged
    const isCompleted = auction.timeRemaining.isCompleted
    const hasStarted =
      auction.timeRemaining.startBlockTimestamp !== undefined &&
      auction.timeRemaining.startBlockTimestamp * BigInt(ONE_SECOND_MS) <= BigInt(Date.now() - ONE_HOUR_MS)
    const hasZeroCommittedVolume = Number(auction.auction?.totalBidVolume ?? 0) === 0

    // Flagged-content hiding stays on for quick launches: the quick-launch classifier is forgeable
    // by construction, so it must never exempt an auction from a user-protection signal. Any
    // exemption policy is deferred to security review (LP-1076).
    // Hide if flagged, or if started more than 1 hour ago and has 0 committed volume
    if (isFlagged || ((hasStarted || isCompleted) && hasZeroCommittedVolume)) {
      hidden.push(value)
    } else {
      visible.push(value)
    }
  })

  return { visible, hidden }
}
