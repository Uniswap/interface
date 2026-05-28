/**
 * Represents a bar's position and tick value for bid line calculations
 */
interface BarPosition {
  tickValue: number
  column?: {
    left: number
    right: number
  }
}

/**
 * Parameters for finding the bid line X position
 */
interface FindBidLineXPositionParams {
  bidPrice: number // Bid price in decimal form (always on a tick)
  bars: BarPosition[] // Array of bars with position and tick information
  tickTolerance?: number // Tolerance for tick matching (default: 0.0000001)
  canvasBounds?: { width: number } // Optional canvas bounds to check if center is visible
}

/**
 * Result of bid line position calculation
 */
interface BidLinePositionResult {
  x: number | null // X coordinate in pixels, or null if not found
  status: 'visible' | 'above_range' | 'below_range' | 'not_found' | 'outside_canvas'
}

/**
 * Finds the X-coordinate for drawing a vertical line at the user's bid price position.
 *
 * Unlike clearing price which may fall between ticks, the bid price is always
 * snapped to a valid tick, so we look for exact tick matches.
 *
 * @param params - Parameters for position calculation
 * @returns Position result with X-coordinate and status
 *
 * @example
 * ```typescript
 * const result = findBidLineXPosition({
 *   bidPrice: 1.5,
 *   bars: [
 *     { tickValue: 1.0, column: { left: 10, right: 20 } },
 *     { tickValue: 1.5, column: { left: 30, right: 40 } },
 *     { tickValue: 2.0, column: { left: 50, right: 60 } }
 *   ]
 * })
 * // Returns: { x: 35, status: 'visible' } (center of matching bar)
 * ```
 */
export function findBidLineXPosition(params: FindBidLineXPositionParams): BidLinePositionResult {
  // tickTolerance is used for range boundary checks; actual matching uses nearest bar
  const { bidPrice, bars, tickTolerance = 0.0000001, canvasBounds } = params

  if (bars.length === 0) {
    return { x: null, status: 'not_found' }
  }

  // Get min and max tick values from bars
  const minTick = Math.min(...bars.map((b) => b.tickValue))
  const maxTick = Math.max(...bars.map((b) => b.tickValue))

  // Check if bid is below the visible range
  if (bidPrice < minTick - tickTolerance) {
    return { x: null, status: 'below_range' }
  }

  // Check if bid is above the visible range
  if (bidPrice > maxTick + tickTolerance) {
    return { x: null, status: 'above_range' }
  }

  // Find the NEAREST bar to the bid price
  // This handles floating point precision differences between:
  // - Bar tick values computed as minTick + i * barStep
  // - Bid price computed from Q96 conversion
  let nearestBar: BarPosition | null = null
  let minDistance = Infinity

  for (const bar of bars) {
    if (!bar.column) {
      continue
    }

    const distance = Math.abs(bar.tickValue - bidPrice)
    if (distance < minDistance) {
      minDistance = distance
      nearestBar = bar
    }
  }

  if (nearestBar && nearestBar.column) {
    // If the nearest bar is too far away (beyond tolerance), it means the bid tick
    // is not present in the visible bars (e.g., zoomed in/out such that the tick is skipped
    // or data is missing). We shouldn't snap to a distant bar.
    if (minDistance > tickTolerance) {
      return { x: null, status: 'not_found' }
    }

    const centerX = getBarCenter(nearestBar.column)

    // If canvas bounds provided, check if the center point is within visible area
    if (canvasBounds) {
      if (centerX < 0 || centerX > canvasBounds.width) {
        return {
          x: centerX,
          status: 'outside_canvas',
        }
      }
    }

    return {
      x: centerX,
      status: 'visible',
    }
  }

  // No bar found (shouldn't happen if there are bars with columns)
  return { x: null, status: 'not_found' }
}

/**
 * Calculates the center X coordinate of a bar column
 * This returns the true geometric center without any offset - matching how
 * timeToCoordinate() positions chart elements
 */
function getBarCenter(column: { left: number; right: number }): number {
  return (column.left + column.right) / 2
}
