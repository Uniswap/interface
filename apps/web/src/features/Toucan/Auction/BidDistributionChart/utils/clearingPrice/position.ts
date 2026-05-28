/**
 * Represents a bar's position and tick value for clearing price calculations
 */
interface BarPosition {
  tickValue: number
  column?: {
    left: number
    right: number
  }
}

/**
 * Parameters for finding the clearing price X position
 */
interface FindClearingPriceXPositionParams {
  clearingPrice: number // Clearing price in decimal form
  bars: BarPosition[] // Array of bars with position and tick information
  positionTolerance?: number // Tolerance for exact position matching (default: 1)
  priceScaleFactor?: number
}

/**
 * Finds the X-coordinate for drawing a vertical line at the clearing price position.
 *
 * This pure function handles three cases:
 * 1. Clearing price exactly matches a bar's position → returns bar center
 * 2. Clearing price falls between two bars → interpolates between their centers
 * 3. Clearing price outside bar range → returns null
 *
 * @param params - Parameters for position calculation
 * @returns X-coordinate in pixels, or null if position cannot be determined
 *
 * @example
 * ```typescript
 * const lineX = findClearingPriceXPosition({
 *   clearingPrice: 1.5,
 *   bars: [
 *     { tickValue: 1.0, column: { left: 10, right: 20 } },
 *     { tickValue: 2.0, column: { left: 30, right: 40 } }
 *   ]
 * })
 * // Returns: 25 (interpolated between bars)
 * ```
 */
export function findClearingPriceXPosition(params: FindClearingPriceXPositionParams): number | null {
  const { clearingPrice, bars } = params

  // Find bars surrounding the clearing price
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    const nextBar = bars.at(i + 1)

    // Skip bars without column data
    if (!bar.column) {
      continue
    }

    // Case 1: Clearing price exactly at this bar (with very small epsilon for float precision)
    // We use a much smaller epsilon (1e-15) than standard chart tolerance because clearing price
    // should ideally not snap to ticks unless it's truly the same value. It represents a calculated
    // market price that can fall anywhere between ticks.
    if (Math.abs(bar.tickValue - clearingPrice) < 1e-15) {
      // console.log('[ToucanChart] Clearing Price Line Debug - Exact Match:', {
      //   clearingPrice,
      //   barTick: bar.tickValue,
      //   diff: bar.tickValue - clearingPrice,
      // })
      return getBarCenter(bar.column)
    }

    // Case 2: Clearing price between this bar and next
    if (!nextBar || !nextBar.column) {
      continue
    }

    // Check if clearing price is in the interval [bar.tickValue, nextBar.tickValue]
    if (bar.tickValue <= clearingPrice && clearingPrice <= nextBar.tickValue) {
      // console.log('[ToucanChart] Clearing Price Line Debug - Interpolation:', {
      //   clearingPrice,
      //   bar1: bar.tickValue,
      //   bar2: nextBar.tickValue,
      //   ratio: (clearingPrice - bar.tickValue) / (nextBar.tickValue - bar.tickValue),
      // })
      return interpolateBarPosition({
        clearingPrice,
        bar1: bar,
        bar2: nextBar,
      })
    }
  }

  // Log if not found
  // console.log('[ToucanChart] Clearing Price Line Debug - Not Found:', {
  //   clearingPrice,
  //   barsRange: bars.length > 0 ? { min: bars[0].tickValue, max: bars[bars.length - 1].tickValue } : 'empty',
  //   barsCount: bars.length,
  // })

  // Case 3: Position not found or outside range
  return null
}

/**
 * Calculates the center X coordinate of a bar column
 */
function getBarCenter(column: { left: number; right: number }): number {
  return (column.left + column.right) / 2
}

/**
 * Parameters for interpolating between two bar positions
 */
interface InterpolateBarPositionParams {
  clearingPrice: number
  bar1: BarPosition
  bar2: BarPosition
}

/**
 * Interpolates the X position between two bars based on clearing price ratio.
 *
 * Uses linear interpolation to find the exact position where the clearing price
 * line should be drawn when it falls between two bar positions.
 *
 * @param params - Interpolation parameters
 * @returns Interpolated X-coordinate in pixels
 */
function interpolateBarPosition(params: InterpolateBarPositionParams): number {
  const { clearingPrice, bar1, bar2 } = params

  // Guard against division by zero when bars have identical tick values
  if (bar2.tickValue === bar1.tickValue) {
    return bar1.column ? getBarCenter(bar1.column) : 0
  }

  // Calculate ratio: how far between bar1 and bar2 is the clearing price?
  const ratio = (clearingPrice - bar1.tickValue) / (bar2.tickValue - bar1.tickValue)

  // Get center positions of both bars
  if (!bar1.column || !bar2.column) {
    return 0
  }

  const bar1CenterX = getBarCenter(bar1.column)
  const bar2CenterX = getBarCenter(bar2.column)

  // Linear interpolation between the two centers
  return bar1CenterX + ratio * (bar2CenterX - bar1CenterX)
}
