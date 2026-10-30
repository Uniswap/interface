/**
 * The tick rules the CCA contract enforces on a bid's `maxPrice`.
 *
 * Auction prices are Q96 fixed-point (price × 2^96) on a grid anchored at the floor price with a
 * fixed tick size. A bid's `maxPrice` must sit on a tick boundary (TickStorage.sol:42) and strictly
 * above the clearing price (ContinuousClearingAuction.sol:409), or the contract reverts.
 */

/** Q96 scale (2^96) — auction prices are `price × 2^96`. */
export const Q96 = 2n ** 96n

interface PriceGrid {
  clearingPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}

/**
 * The first tick strictly above the clearing price — the contract's minimum valid `maxPrice`.
 *
 * - At auction start (clearing = floor) this is floor + 1 tick.
 * - Clearing between ticks: the next tick above it.
 * - Clearing exactly on a tick: clearing + 1 tick (strictly above).
 *
 * BigInt `/` truncates toward zero, so a clearing price below the floor grid still lands on a
 * grid tick (clearing 0 → the first positive tick).
 */
export function calculateMinValidBidQ96({ clearingPriceQ96, floorPriceQ96, tickSizeQ96 }: PriceGrid): bigint {
  if (tickSizeQ96 <= 0n) {
    return clearingPriceQ96 + 1n
  }
  const ticksBelowClearing = (clearingPriceQ96 - floorPriceQ96) / tickSizeQ96
  return floorPriceQ96 + (ticksBelowClearing + 1n) * tickSizeQ96
}

/**
 * The highest bid price a max-bid-price validation hook will accept: the largest tick at or below
 * the hook's ceiling, on the same floor-anchored grid as {@link calculateMinValidBidQ96}.
 *
 * The hook reverts when `maxPrice > maxBidPrice` (MaxBidPriceValidationHook.validate), and the
 * auction independently requires bids to sit on a tick, so the effective ceiling is the ceiling
 * rounded DOWN to the grid — never up, which would revert.
 *
 * Undefined when the ceiling sits below the floor price: no tick on the grid is at or below it, so
 * no bid can ever be valid.
 */
export function calculateMaxValidBidQ96({
  maxBidPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: {
  maxBidPriceQ96: bigint
  floorPriceQ96: bigint
  tickSizeQ96: bigint
}): bigint | undefined {
  if (maxBidPriceQ96 < floorPriceQ96) {
    return undefined
  }
  if (tickSizeQ96 <= 0n) {
    return maxBidPriceQ96
  }
  // delta is non-negative here, so BigInt truncation is a floor.
  return floorPriceQ96 + ((maxBidPriceQ96 - floorPriceQ96) / tickSizeQ96) * tickSizeQ96
}

/**
 * Whether the auction can no longer take a new bid under the hook's ceiling: once the clearing
 * price reaches the last tick under the ceiling, no price is both strictly above clearing and at
 * or below the ceiling. Existing bids stay active and keep partially filling.
 */
export function isMaxBidPriceReached({
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
  maxBidPriceQ96,
}: PriceGrid & { maxBidPriceQ96: bigint }): boolean {
  const maxValidBid = calculateMaxValidBidQ96({ maxBidPriceQ96, floorPriceQ96, tickSizeQ96 })
  if (maxValidBid === undefined) {
    return true
  }
  return calculateMinValidBidQ96({ clearingPriceQ96, floorPriceQ96, tickSizeQ96 }) > maxValidBid
}

/** Whether the contract would reject `bidPriceQ96` for sitting below the minimum valid bid. */
export function isBidBelowMinimum({
  bidPriceQ96,
  clearingPriceQ96,
  floorPriceQ96,
  tickSizeQ96,
}: PriceGrid & { bidPriceQ96: bigint }): boolean {
  const minValidBid = calculateMinValidBidQ96({ clearingPriceQ96, floorPriceQ96, tickSizeQ96 })
  return bidPriceQ96 < minValidBid
}

/**
 * Snaps a price value to the nearest valid tick boundary (half rounds up). The result is on the
 * floor-anchored grid and never below the minimum valid bid. A non-positive tick size has no grid
 * to snap to, so the value comes back untouched.
 */
export function snapToNearestTick({
  value,
  floorPrice,
  clearingPrice,
  tickSize,
}: {
  value: bigint
  floorPrice: bigint
  clearingPrice: bigint
  tickSize: bigint
}): bigint {
  if (tickSize <= 0n) {
    return value
  }

  const delta = value - floorPrice
  const quotient = delta / tickSize
  const remainder = delta % tickSize

  const minValidBid = calculateMinValidBidQ96({
    clearingPriceQ96: clearingPrice,
    floorPriceQ96: floorPrice,
    tickSizeQ96: tickSize,
  })

  if (remainder === 0n) {
    const snapped = floorPrice + quotient * tickSize
    return snapped < minValidBid ? minValidBid : snapped
  }

  // The remainder is negative when value < floorPrice, which never rounds up.
  const shouldRoundUp = remainder * 2n >= tickSize
  const snappedValue = floorPrice + (quotient + (shouldRoundUp ? 1n : 0n)) * tickSize

  return snappedValue < minValidBid ? minValidBid : snappedValue
}

/** Parses a decimal Q96 price string (proto values) into a bigint, or throws naming `label`. */
export function parseQ96(value: string | undefined, label: string): bigint {
  if (value === undefined || !/^\d+$/.test(value)) {
    throw new Error(`${label} is not a valid Q96 price: ${value ?? 'undefined'}`)
  }
  return BigInt(value)
}
