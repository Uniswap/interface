import type { AuctionPhase } from '~/features/Toucan/Auction/hooks/useAuctionTimeRemaining'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

/**
 * An auction failed when it has completed without meeting its launch threshold — no token
 * launched. Returns false for any other phase, or when the threshold is missing, zero, or
 * malformed.
 */
export function isAuctionFailed({
  phase,
  totalBidVolume,
  requiredCurrencyRaised,
}: {
  phase: AuctionPhase | undefined
  /** Raw committed volume and launch threshold (same currency units). */
  totalBidVolume?: string
  requiredCurrencyRaised?: string
}): boolean {
  if (phase !== 'completed') {
    return false
  }
  const required = safeBigInt(requiredCurrencyRaised)
  const committed = safeBigInt(totalBidVolume) ?? 0n
  return required !== null && required > 0n && committed < required
}
