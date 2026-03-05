import { formatUnits } from 'viem'
import { toSubscript } from '~/components/Charts/utils/subscript'
import { AuctionBidStatus, AuctionProgressState, UserBid } from '~/components/Toucan/Auction/store/types'

// ─────────────────────────────────────────────────────────────────────────────
// Unified Bid State System
// ─────────────────────────────────────────────────────────────────────────────
// This provides a single source of truth for deriving display states from bid data.
//
// Terminology mapping (backend status → UI display):
// - AuctionBidStatus.Submitted → active bid (inRange/outOfRange/complete)
// - AuctionBidStatus.Claimed   → 'withdrawn' (user withdrew their tokens)
// - AuctionBidStatus.Exited    → 'refunded' (user got their unused budget back)
// - Auction failed to graduate → 'fundsAvailable' (user can withdraw everything)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified display state for bids, using UI terminology.
 * Used for icons, colors, and status indicators across Bid.tsx and BidDetailsModal.
 */
export type BidDisplayState =
  | 'pending' // Optimistic bid, showing spinner
  | 'fundsAvailable' // Auction failed to graduate - all funds can be withdrawn
  | 'withdrawn' // AuctionBidStatus.Claimed - tokens have been withdrawn
  | 'refundedInRange' // AuctionBidStatus.Exited - budget refunded, was in range
  | 'refundedOutOfRange' // AuctionBidStatus.Exited - budget refunded, was out of range
  | 'complete' // Fully filled (100%), waiting to withdraw
  | 'inRange' // In range, actively filling
  | 'outOfRange' // Out of range, stopped filling

/**
 * Granular description state for modal description text.
 * More specific than BidDisplayState to handle all copy permutations.
 */
type BidDescriptionState =
  | 'overNotGraduated'
  | 'overNotGraduatedExited'
  | 'completeInProgress'
  | 'completePreClaim'
  | 'completeOver'
  | 'completeClaimed'
  | 'inRangeInProgress'
  | 'inRangePreClaim'
  | 'inRangeOver'
  | 'inRangeOutOfRangeClaimed'
  | 'outOfRangeInProgress'
  | 'outOfRangePreClaim'
  | 'outOfRangePreClaimExited'
  | 'outOfRangeOver'
  | 'outOfRangeOverExited'

/**
 * Complete display info for a bid, computed from raw bid data.
 * Single source of truth used by both Bid.tsx list and BidDetailsModal.
 */
interface BidDisplayInfo {
  /** Primary display state for icons and styling */
  displayState: BidDisplayState
  /** Granular state for description text in modal */
  descriptionState: BidDescriptionState
  /** Whether bid is 100% filled - used for checkmark icon */
  isComplete: boolean
  /** Whether auction is still in progress */
  isAuctionInProgress: boolean
  /** Whether auction has ended */
  isAuctionEnded: boolean
}

interface GetBidDisplayInfoParams {
  bidStatus: AuctionBidStatus
  isInRange: boolean
  isFullyFilled: boolean
  auctionProgressState: AuctionProgressState
  isGraduated: boolean
  isInPreClaimWindow?: boolean
}

/**
 * Single source of truth for computing all bid display states.
 * Both Bid.tsx and BidDetailsModal should use this function.
 */
export function getBidDisplayInfo({
  bidStatus,
  isInRange,
  isFullyFilled,
  auctionProgressState,
  isGraduated,
  isInPreClaimWindow = false,
}: GetBidDisplayInfoParams): BidDisplayInfo {
  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const isAuctionInProgress = auctionProgressState === AuctionProgressState.IN_PROGRESS

  // Compute primary display state
  const displayState = computeDisplayState({
    bidStatus,
    isInRange,
    isFullyFilled,
    isAuctionEnded,
    isGraduated,
  })

  // Compute granular description state
  const descriptionState = computeDescriptionState({
    bidStatus,
    isInRange,
    isFullyFilled,
    isAuctionEnded,
    isAuctionInProgress,
    isGraduated,
    isInPreClaimWindow,
  })

  return {
    displayState,
    descriptionState,
    isComplete: isFullyFilled,
    isAuctionInProgress,
    isAuctionEnded,
  }
}

function computeDisplayState({
  bidStatus,
  isInRange,
  isFullyFilled,
  isAuctionEnded,
  isGraduated,
}: {
  bidStatus: AuctionBidStatus
  isInRange: boolean
  isFullyFilled: boolean
  isAuctionEnded: boolean
  isGraduated: boolean
}): BidDisplayState {
  const isExited = bidStatus === AuctionBidStatus.Exited
  const isClaimed = bidStatus === AuctionBidStatus.Claimed

  // Auction failed to graduate - all funds available
  if (isAuctionEnded && !isGraduated) {
    return isExited ? 'withdrawn' : 'fundsAvailable'
  }

  if (isClaimed) {
    return 'withdrawn'
  }

  if (isExited) {
    return isInRange ? 'refundedInRange' : 'refundedOutOfRange'
  }

  // Priority 3: Active bids (Submitted status)
  if (isFullyFilled) {
    return 'complete'
  }

  if (isInRange) {
    return 'inRange'
  }

  return 'outOfRange'
}

function computeDescriptionState({
  bidStatus,
  isInRange,
  isFullyFilled,
  isAuctionEnded,
  isAuctionInProgress,
  isGraduated,
  isInPreClaimWindow,
}: {
  bidStatus: AuctionBidStatus
  isInRange: boolean
  isFullyFilled: boolean
  isAuctionEnded: boolean
  isAuctionInProgress: boolean
  isGraduated: boolean
  isInPreClaimWindow: boolean
}): BidDescriptionState {
  const isExited = bidStatus === AuctionBidStatus.Exited
  const isClaimed = bidStatus === AuctionBidStatus.Claimed
  if (isAuctionEnded && !isGraduated) {
    return isExited ? 'overNotGraduatedExited' : 'overNotGraduated'
  }

  if (isAuctionInProgress) {
    if (isFullyFilled) {
      return 'completeInProgress'
    }
    if (isInRange) {
      return 'inRangeInProgress'
    }
    return 'outOfRangeInProgress'
  }

  // Handle pre-claim window (after auction ends, before claim period starts)
  if (isAuctionEnded && isGraduated && isInPreClaimWindow) {
    if (isFullyFilled) {
      return 'completePreClaim'
    }
    if (isInRange) {
      return 'inRangePreClaim'
    }
    return isExited ? 'outOfRangePreClaimExited' : 'outOfRangePreClaim'
  }

  if (isClaimed) {
    if (isFullyFilled) {
      return 'completeClaimed'
    }
    return 'inRangeOutOfRangeClaimed'
  }

  if (isFullyFilled) {
    return 'completeOver'
  }
  if (isInRange) {
    return 'inRangeOver'
  }
  if (isExited) {
    return 'outOfRangeOverExited'
  }

  return 'outOfRangeOver'
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper to compute isFullyFilled from bid data
// ─────────────────────────────────────────────────────────────────────────────
export function computeIsFullyFilled(bid: UserBid): boolean {
  const totalAmount = BigInt(bid.baseTokenInitial)
  const filledAmount = BigInt(bid.currencySpent)
  return totalAmount > 0n && filledAmount >= totalAmount
}

export function formatTokenAmountWithSubscript({
  raw,
  decimals,
  symbol,
}: {
  raw: bigint
  decimals: number
  symbol: string
}): string {
  const rawString = formatUnits(raw, decimals)
  const trimmed = rawString.includes('.') ? rawString.replace(/\.?0+$/, '') : rawString
  if (!trimmed.includes('.')) {
    return `${trimmed || '0'} ${symbol}`
  }

  const [integerPart, decimalPart] = trimmed.split('.')
  if (integerPart !== '0' || !decimalPart) {
    return `${trimmed || '0'} ${symbol}`
  }

  let leadingZeros = 0
  while (leadingZeros < decimalPart.length && decimalPart[leadingZeros] === '0') {
    leadingZeros += 1
  }

  if (leadingZeros >= 4 && leadingZeros < decimalPart.length) {
    const significantPart = decimalPart.slice(leadingZeros)
    const clippedSignificantPart = significantPart.slice(0, 3)
    return `0.0${toSubscript(leadingZeros)}${clippedSignificantPart} ${symbol}`
  }

  return `${trimmed || '0'} ${symbol}`
}
