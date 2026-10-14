import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction, Bid } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { AuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { AuctionBidStatus, type UserBid } from '~/features/Toucan/Auction/store/types'
import { sumBidBudgets } from '~/features/Toucan/Auction/utils/bidBudgets'
import { mapApiBidsToUserBids } from '~/features/Toucan/Auction/utils/mapApiBidToUserBid'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  resolveAuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { parseNonNegativeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { filterUnclaimedBids, sumTokensReceived } from '~/features/Toucan/Auction/utils/tokensReceived'

export enum ClaimableAllocationState {
  Loading = 'loading',
  /** The auction has not ended, or its claim window has not opened yet. */
  NotOpen = 'not-open',
  Claimable = 'claimable',
  /** The auction did not graduate and the wallet still has bids to refund, in the bid currency. */
  Refundable = 'refundable',
  /** Nothing to settle: no bids, an exact-zero allocation, or a failed auction already refunded. */
  NotEligible = 'not-eligible',
  Claimed = 'claimed',
  /** A request or calculation failed; never collapsed to zero. */
  Unavailable = 'unavailable',
}

export type ClaimableAllocation =
  | { status: ClaimableAllocationState.Loading }
  | { status: ClaimableAllocationState.NotOpen }
  | { status: ClaimableAllocationState.Claimable; amountRaw: bigint }
  | { status: ClaimableAllocationState.Refundable; amountRaw: bigint }
  | { status: ClaimableAllocationState.NotEligible }
  | { status: ClaimableAllocationState.Claimed }
  | { status: ClaimableAllocationState.Unavailable; error: Error }

export type WithdrawableAllocation = Extract<
  ClaimableAllocation,
  { status: ClaimableAllocationState.Claimable | ClaimableAllocationState.Refundable }
>

/** The states that mount the transaction store and may open the withdraw modal. */
export function isWithdrawableAllocation(allocation: ClaimableAllocation): allocation is WithdrawableAllocation {
  return (
    allocation.status === ClaimableAllocationState.Claimable ||
    allocation.status === ClaimableAllocationState.Refundable
  )
}

/** There is a card to paint: something to withdraw, or an error that offers Retry. */
export function hasClaimCardContent(allocation: ClaimableAllocation): boolean {
  return isWithdrawableAllocation(allocation) || allocation.status === ClaimableAllocationState.Unavailable
}

/** The pure inputs of the shared display resolver; the refetch callback the hook also returns is not one of them. */
export type ClaimableAllocationDataSources = Pick<
  AuctionDisplayDataSources,
  'currentBlock' | 'currencyRaised' | 'pools'
>

export function getAuctionClaimBlock(claimBlock: string | undefined): bigint | null {
  return parseNonNegativeBigInt(claimBlock)
}

/**
 * The refund amount for the card, matching what the ADP's WithdrawModal will execute for an auction
 * that did not graduate: every still-submitted bid is refunded in full, so it is the sum of their
 * budgets in the bid currency. Exited bids are already refunded, and a failed auction has no claim
 * window.
 */
function resolveRefund(userBids: UserBid[]): ClaimableAllocation {
  const submittedBids = userBids.filter((bid) => bid.status === AuctionBidStatus.Submitted)
  if (submittedBids.length === 0) {
    return { status: ClaimableAllocationState.NotEligible }
  }
  // TODO(CONS-3544): drop once the ADP parses strictly too. A missing or malformed budget must not
  // collapse into a zero refund.
  if (submittedBids.some((bid) => parseNonNegativeBigInt(bid.baseTokenInitial) === null)) {
    return { status: ClaimableAllocationState.Unavailable, error: new Error('Bid budget is not an integer') }
  }
  const amountRaw = sumBidBudgets(submittedBids)
  if (amountRaw === 0n) {
    return { status: ClaimableAllocationState.NotEligible }
  }
  return { status: ClaimableAllocationState.Refundable, amountRaw }
}

/**
 * Pure mapping from the wallet's bids plus the shared auction display sources to a claim state.
 * The amount rule matches what the ADP's WithdrawModal executes: the sum of server-computed `Bid.amount` over
 * bids not yet claimed, only once the auction has ended and graduated; a failed auction resolves to
 * the refund of its still-submitted bids instead.
 */
export function resolveClaimableAllocation({
  auction,
  dataSources,
  bids,
  error,
}: {
  auction: PlainMessage<Auction>
  dataSources: ClaimableAllocationDataSources
  bids: PlainMessage<Bid>[] | undefined
  error: Error | null
}): ClaimableAllocation {
  if (error) {
    return { status: ClaimableAllocationState.Unavailable, error }
  }
  const { phase, result } = resolveAuctionDisplayState({ auction, ...dataSources })
  if (phase === AuctionDisplayPhase.Loading) {
    return { status: ClaimableAllocationState.Loading }
  }
  if (phase === AuctionDisplayPhase.Upcoming || phase === AuctionDisplayPhase.Live) {
    return { status: ClaimableAllocationState.NotOpen }
  }
  const { currencyRaised, currentBlock } = dataSources
  // Ended, but the raised total is still loading or the checkpoint has not caught up with the end block. `idle`
  // (the checkpoint never ran) is settled: it falls through to the Unknown-outcome Unavailable path with a retry.
  if (
    phase === AuctionDisplayPhase.Ended &&
    result === AuctionDisplayResult.Unknown &&
    currencyRaised.status === 'loading'
  ) {
    return { status: ClaimableAllocationState.Loading }
  }
  const claimBlock = getAuctionClaimBlock(auction.claimBlock)
  if (
    result === AuctionDisplayResult.Successful &&
    claimBlock !== null &&
    currentBlock.status === 'success' &&
    currentBlock.blockNumber < claimBlock
  ) {
    return { status: ClaimableAllocationState.NotOpen }
  }
  // Auction-level failures below are only shown to wallets that actually bid; everyone else sees no card.
  if (!bids) {
    return { status: ClaimableAllocationState.Loading }
  }
  const userBids = mapApiBidsToUserBids(bids)
  if (userBids.length === 0) {
    return { status: ClaimableAllocationState.NotEligible }
  }
  if (phase === AuctionDisplayPhase.Unknown) {
    return { status: ClaimableAllocationState.Unavailable, error: new Error('Auction phase could not be resolved') }
  }
  if (result === AuctionDisplayResult.Unknown) {
    return { status: ClaimableAllocationState.Unavailable, error: new Error('Auction outcome could not be resolved') }
  }
  if (result === AuctionDisplayResult.Failed) {
    return resolveRefund(userBids)
  }
  if (claimBlock === null) {
    return { status: ClaimableAllocationState.Unavailable, error: new Error('Auction claim block is invalid') }
  }
  const unclaimedBids = filterUnclaimedBids(userBids)
  if (unclaimedBids.length === 0) {
    return { status: ClaimableAllocationState.Claimed }
  }
  // TODO(CONS-3544): drop once the ADP parses strictly too. A missing or malformed server amount must
  // not collapse into a zero allocation.
  if (unclaimedBids.some((bid) => parseNonNegativeBigInt(bid.amount) === null)) {
    return { status: ClaimableAllocationState.Unavailable, error: new Error('Bid amount is not an integer') }
  }
  const amountRaw = sumTokensReceived(unclaimedBids)
  if (amountRaw === 0n) {
    return { status: ClaimableAllocationState.NotEligible }
  }
  return { status: ClaimableAllocationState.Claimable, amountRaw }
}
