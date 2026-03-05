import { MARKER_CONFIG, TOLERANCE } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { MarkerPosition } from '~/components/Toucan/Auction/BidDistributionChart/markers/types'

/**
 * Calculates the tolerance value for tick comparisons based on tick size
 *
 * @param tickSizeDecimal - The tick size in decimal format
 * @returns The calculated tolerance value
 */
export function calculateTickTolerance(tickSizeDecimal: number): number {
  return Number.isFinite(tickSizeDecimal) && tickSizeDecimal > 0
    ? tickSizeDecimal * TOLERANCE.TICK_COMPARISON
    : TOLERANCE.FALLBACK
}

/**
 * Checks if two arrays of marker positions are effectively equal.
 * Uses tolerance-based comparison for floating point positions to prevent
 * unnecessary re-renders when positions change by sub-pixel amounts.
 *
 * @param leftPositions - First array of marker positions
 * @param rightPositions - Second array of marker positions
 * @returns True if positions are equal within tolerance
 */
export function markerPositionsEqual(leftPositions: MarkerPosition[], rightPositions: MarkerPosition[]): boolean {
  if (leftPositions.length !== rightPositions.length) {
    return false
  }

  return leftPositions.every((leftPosition, index) => {
    const rightPosition = rightPositions[index]

    // Check if bids arrays have the same bid IDs
    if (leftPosition.bids.length !== rightPosition.bids.length) {
      return false
    }

    const leftBidIds = new Set(leftPosition.bids.map((bid) => bid.bidId))
    const rightBidIds = new Set(rightPosition.bids.map((bid) => bid.bidId))
    const bidsEqual = leftBidIds.size === rightBidIds.size && [...leftBidIds].every((id) => rightBidIds.has(id))

    return (
      leftPosition.id === rightPosition.id &&
      leftPosition.address === rightPosition.address &&
      Math.abs(leftPosition.left - rightPosition.left) < MARKER_CONFIG.POSITION_TOLERANCE &&
      Math.abs(leftPosition.top - rightPosition.top) < MARKER_CONFIG.POSITION_TOLERANCE &&
      leftPosition.isInRange === rightPosition.isInRange &&
      bidsEqual
    )
  })
}
