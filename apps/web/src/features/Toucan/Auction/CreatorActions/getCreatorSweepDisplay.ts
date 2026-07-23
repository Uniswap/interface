import { AuctionOutcome } from '~/features/Toucan/Auction/store/types'

export interface CreatorSweepDisplay {
  // Which copy set to show: failed launch recovers the full deposited supply,
  // graduated launch recovers only the unsold remainder
  variant: 'failed' | 'graduated'
  // Raw amount of auction tokens the sweep returns (undefined while loading)
  amountRaw: bigint | undefined
  // The one-shot sweep already happened — show the done state instead of the CTA
  isSwept: boolean
}

/**
 * Decides whether (and how) to show the creator's sweep-unsold-tokens card.
 * Returns null when the card should not render at all: viewer is not the
 * tokensRecipient, the auction hasn't ended, or a graduated auction has
 * nothing left to sweep.
 */
export function getCreatorSweepDisplay({
  outcome,
  isConnectedTokensRecipient,
  hasSwept,
  depositedSupplyRaw,
  remainingSupplyRaw,
}: {
  outcome: AuctionOutcome
  isConnectedTokensRecipient: boolean
  // From hasSweptUnsoldTokens(): undefined while the chain read is pending
  hasSwept: boolean | undefined
  // Auction.total_supply — the amount deposited into the auction (failed-launch sweep amount)
  depositedSupplyRaw: bigint | undefined
  // On-chain remainingSupply() — the graduated-launch sweep amount (undefined while loading)
  remainingSupplyRaw: bigint | undefined
}): CreatorSweepDisplay | null {
  if (!isConnectedTokensRecipient) {
    return null
  }
  if (outcome !== AuctionOutcome.FAILED && outcome !== AuctionOutcome.GRADUATED) {
    return null
  }
  // Wait for the sweep latch before rendering, so the CTA never flashes for an already-swept auction
  if (hasSwept === undefined) {
    return null
  }

  if (outcome === AuctionOutcome.FAILED) {
    return { variant: 'failed', amountRaw: depositedSupplyRaw, isSwept: hasSwept }
  }

  // Graduated: nothing to recover once swept-state is known and the remainder is zero
  if (!hasSwept && remainingSupplyRaw === 0n) {
    return null
  }
  return { variant: 'graduated', amountRaw: remainingSupplyRaw, isSwept: hasSwept }
}
