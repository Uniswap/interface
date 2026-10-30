import type { AuctionPhase } from '~/features/Toucan/Auction/hooks/useAuctionTimeRemaining'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

/**
 * An auction failed when it has completed without meeting its launch threshold — no token
 * launched. Returns false for any other phase.
 *
 * The served `isGraduated` is the contract's own verdict, which compares FILLED volume to the
 * threshold, so it wins whenever it is set. While it is unset (the backend has not resolved the
 * ended auction yet, or never can), committed volume below the threshold still proves failure,
 * because filled volume can never exceed committed; committed volume at or above the threshold
 * proves nothing either way, so that case reads as not failed.
 */
export function isAuctionFailed({
  phase,
  isGraduated,
  totalBidVolume,
  requiredCurrencyRaised,
}: {
  phase: AuctionPhase | undefined
  isGraduated?: boolean
  /** Raw committed volume and launch threshold (same currency units). */
  totalBidVolume?: string
  requiredCurrencyRaised?: string
}): boolean {
  if (phase !== 'completed') {
    return false
  }
  if (isGraduated !== undefined) {
    return !isGraduated
  }
  const required = safeBigInt(requiredCurrencyRaised)
  const committed = safeBigInt(totalBidVolume) ?? 0n
  return required !== null && required > 0n && committed < required
}
