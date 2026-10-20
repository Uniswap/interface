import { toSubscript } from 'utilities/src/format/toSubscript'
import { formatUnits } from '~/chains'
import { AuctionBidStatus, AuctionOutcome, UserBid } from '~/features/Toucan/Auction/store/types'

// ─────────────────────────────────────────────────────────────────────────────
// Unified Bid State System
// ─────────────────────────────────────────────────────────────────────────────
// This provides a single source of truth for deriving display states from bid data.
//
// Terminology mapping (backend status → UI display):
// - AuctionBidStatus.Submitted → active bid (inRange/outOfRange/complete)
// - AuctionBidStatus.Claimed   → 'withdrawn' (user withdrew their tokens)
// - AuctionBidStatus.Exited    → 'refunded' (user got their unused budget back)
// - AuctionOutcome.FAILED      → 'fundsAvailable' (user can withdraw everything)
// - AuctionOutcome.UNKNOWN     → 'pending' (outcome undecided; assert nothing about the funds)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified display state for bids, using UI terminology.
 * Used for icons, colors, and status indicators across Bid.tsx and BidDetailsModal.
 */
export type BidDisplayState =
  | 'pending' // Optimistic bid, or outcome not yet known - showing spinner
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
export type BidDescriptionState =
  | 'awaitingOutcome' // Outcome not yet known - render no description rather than a wrong one
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
  | 'outOfRangeInProgressAwaitingThreshold' // Unused budget is locked until the auction graduates
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
  /** Whether the auction is over, derived from `outcome` — never from progress state */
  isAuctionEnded: boolean
}

interface GetBidDisplayInfoParams {
  bidStatus: AuctionBidStatus
  isInRange: boolean
  isFullyFilled: boolean
  /**
   * Whether the auction is currently running. Deliberately a boolean rather than the progress
   * state: ended-ness comes from `outcome`, so the only thing left to know is live-vs-not, and a
   * boolean cannot be handed an ENDED that silently reads as "not in progress".
   */
  isAuctionInProgress: boolean
  /**
   * Tri-state outcome, not a boolean: GRADUATED and FAILED are the only values that may drive copy
   * about the bidder's funds. UNKNOWN means the page cannot tell yet.
   */
  outcome: AuctionOutcome
  isInPreClaimWindow?: boolean
  /**
   * Whether currencyRaised has reached requiredCurrencyRaised. The contract won't refund an outbid
   * bid's unused budget until then, so a live out-of-range bid needs different copy when this is
   * `false`. `undefined` (undecided, or omitted by the bids list, which renders no description)
   * keeps the default copy.
   */
  hasMetThreshold?: boolean
}

/**
 * Single source of truth for computing all bid display states.
 * Both Bid.tsx and BidDetailsModal should use this function.
 */
export function getBidDisplayInfo({
  bidStatus,
  isInRange,
  isFullyFilled,
  isAuctionInProgress,
  outcome,
  isInPreClaimWindow = false,
  hasMetThreshold,
}: GetBidDisplayInfoParams): BidDisplayInfo {
  // GRADUATED and FAILED only exist once the auction is over, so deriving ended-ness from `outcome`
  // means a caller cannot pass an ended state alongside an undecided outcome.
  const isAuctionEnded = outcome === AuctionOutcome.GRADUATED || outcome === AuctionOutcome.FAILED

  // Compute primary display state
  const displayState = computeDisplayState({
    bidStatus,
    isInRange,
    isFullyFilled,
    outcome,
  })

  // Compute granular description state
  const descriptionState = computeDescriptionState({
    bidStatus,
    isInRange,
    isFullyFilled,
    isAuctionInProgress,
    outcome,
    isInPreClaimWindow,
    hasMetThreshold,
  })

  return {
    displayState,
    descriptionState,
    isComplete: isFullyFilled,
    isAuctionEnded,
  }
}

function computeDisplayState({
  bidStatus,
  isInRange,
  isFullyFilled,
  outcome,
}: {
  bidStatus: AuctionBidStatus
  isInRange: boolean
  isFullyFilled: boolean
  outcome: AuctionOutcome
}): BidDisplayState {
  const isExited = bidStatus === AuctionBidStatus.Exited
  const isClaimed = bidStatus === AuctionBidStatus.Claimed

  // Outcome undecided: a graduated auction also reads as "not graduated" here, so anything we say
  // about the funds has a 50% chance of being a lie. Fall back to the spinner treatment.
  if (outcome === AuctionOutcome.UNKNOWN) {
    return 'pending'
  }

  // Auction failed to graduate - all funds available
  if (outcome === AuctionOutcome.FAILED) {
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
  isAuctionInProgress,
  outcome,
  isInPreClaimWindow,
  hasMetThreshold,
}: {
  bidStatus: AuctionBidStatus
  isInRange: boolean
  isFullyFilled: boolean
  isAuctionInProgress: boolean
  outcome: AuctionOutcome
  isInPreClaimWindow: boolean
  hasMetThreshold: boolean | undefined
}): BidDescriptionState {
  const isExited = bidStatus === AuctionBidStatus.Exited
  const isClaimed = bidStatus === AuctionBidStatus.Claimed

  // See computeDisplayState: undecided outcome must not produce "the auction didn't launch" copy.
  if (outcome === AuctionOutcome.UNKNOWN) {
    return 'awaitingOutcome'
  }

  if (outcome === AuctionOutcome.FAILED) {
    return isExited ? 'overNotGraduatedExited' : 'overNotGraduated'
  }

  if (isAuctionInProgress) {
    if (isFullyFilled) {
      return 'completeInProgress'
    }
    if (isInRange) {
      return 'inRangeInProgress'
    }
    // An exited bid already got its refund, which the contract only allows after graduation.
    return hasMetThreshold === false && !isExited ? 'outOfRangeInProgressAwaitingThreshold' : 'outOfRangeInProgress'
  }

  // Handle pre-claim window (after auction ends, before claim period starts)
  if (outcome === AuctionOutcome.GRADUATED && isInPreClaimWindow) {
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
