/**
 * Computes the Y pixel coordinate for a given price within the chart area.
 *
 * Price increases upward but Y increases downward (canvas coordinate system).
 * Returns null if the price is outside the visible range.
 */
export function computeYPosition({
  price,
  scaleFactor,
  visiblePriceRange,
  chartAreaHeight,
}: {
  price: number
  scaleFactor: number
  visiblePriceRange: { min: number; max: number }
  chartAreaHeight: number
}): number | null {
  const scaledPrice = price * scaleFactor
  const { min, max } = visiblePriceRange
  if (max === min) {
    return null
  }
  const y = chartAreaHeight - ((scaledPrice - min) / (max - min)) * chartAreaHeight
  if (y < 0 || y > chartAreaHeight) {
    return null
  }
  return y
}

/**
 * Determines if a bid price is outside the visible chart range.
 * Returns 'up' if above the visible range, 'down' if below, null if within range.
 */
export function computeBidOutOfRange({
  bidPrice,
  scaleFactor,
  visiblePriceRange,
}: {
  bidPrice: number
  scaleFactor: number
  visiblePriceRange: { min: number; max: number }
}): 'up' | 'down' | null {
  const scaledBidPrice = bidPrice * scaleFactor
  const { min, max } = visiblePriceRange
  if (max === min) {
    return null
  }
  if (scaledBidPrice > max) {
    return 'up'
  }
  if (scaledBidPrice < min) {
    return 'down'
  }
  return null
}
