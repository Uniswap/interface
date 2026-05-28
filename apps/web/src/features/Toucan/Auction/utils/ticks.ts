interface CalculateMinValidBidParams {
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}

/**
 * Calculates the minimum valid bid price according to contract rules.
 *
 * Contract constraints:
 * 1. Bids must be at tick boundaries (TickStorage.sol:42)
 * 2. Bids must be strictly above the clearing price (ContinuousClearingAuction.sol:409)
 *
 * Scenarios:
 * - At auction start: clearing price = floor price, minimum bid = floor + 1 tick
 * - Clearing price between ticks: minimum bid = next tick strictly above clearing
 * - Clearing price exactly at a tick: minimum bid = clearing + 1 tick (must be strictly above)
 */
export function calculateMinValidBidQ96({
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: CalculateMinValidBidParams): bigint {
  if (tickSizeQ96 <= 0n) {
    return clearingPriceQ96 + 1n
  }

  const delta = clearingPriceQ96 - floorPriceQ96
  const ticksBelowClearing = delta / tickSizeQ96

  // Whether clearing price is exactly at a tick boundary or between ticks,
  // minimum bid is always the first tick strictly above clearing price
  const ticksAboveFloor = ticksBelowClearing + 1n

  return floorPriceQ96 + ticksAboveFloor * tickSizeQ96
}

/**
 * Checks if a bid price is below the minimum valid bid.
 * Returns true if the bid would be rejected by the contract.
 */
export function isBidBelowMinimum({
  bidPriceQ96,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: {
  bidPriceQ96: bigint
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): boolean {
  const minValidBid = calculateMinValidBidQ96({ clearingPriceQ96, floorPriceQ96, tickSizeQ96 })
  return bidPriceQ96 < minValidBid
}

interface SnapToNearestTickParams {
  value: bigint
  floorPrice: bigint
  clearingPrice: bigint
  tickSize: bigint
}

/**
 * Snaps a price value to the nearest valid tick boundary.
 * The result is guaranteed to be:
 * 1. At a tick boundary (aligned to floor price + N * tick size)
 * 2. Strictly above the clearing price (contract requirement)
 */
export function snapToNearestTick({ value, floorPrice, clearingPrice, tickSize }: SnapToNearestTickParams): bigint {
  if (tickSize <= 0n) {
    return value
  }

  const delta = value - floorPrice
  // If value is below floor price, we still want to align it to the grid defined by floorPrice.
  // However, we also need to respect the clearingPrice minimum (strictly above).

  const quotient = delta / tickSize
  const remainder = delta % tickSize

  // Calculate the minimum valid bid (strictly above clearing price)
  const minValidBid = calculateMinValidBidQ96({
    clearingPriceQ96: clearingPrice,
    floorPriceQ96: floorPrice,
    tickSizeQ96: tickSize,
  })

  // If exact match on a tick, check if it's valid (strictly above clearingPrice)
  if (remainder === 0n) {
    const snapped = floorPrice + quotient * tickSize
    // Must be strictly above clearing price, so >= minValidBid
    return snapped < minValidBid ? minValidBid : snapped
  }

  // Round to nearest tick
  // Note: remainder can be negative if value < floorPrice (though unlikely for bids)
  const shouldRoundUp = remainder * 2n >= tickSize
  const ticksFromFloor = quotient + (shouldRoundUp ? 1n : 0n)

  const snappedValue = floorPrice + ticksFromFloor * tickSize

  // Ensure result is strictly above clearing price
  if (snappedValue < minValidBid) {
    return minValidBid
  }

  return snappedValue
}
