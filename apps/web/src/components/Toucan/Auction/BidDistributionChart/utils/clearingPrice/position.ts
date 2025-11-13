import { COORDINATE_SCALING } from 'components/Toucan/Auction/BidDistributionChart/constants'

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
  const { clearingPrice, bars, positionTolerance = 1 } = params

  // Convert clearing price to scaled coordinate for comparison
  const clearingPriceScaled = Math.round(clearingPrice * COORDINATE_SCALING.PRICE_SCALE_FACTOR)

  // Find bars surrounding the clearing price
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]
    const nextBar = bars[i + 1]

    // Skip bars without column data
    if (!bar.column) {
      continue
    }

    const barTimeScaled = Math.round(bar.tickValue * COORDINATE_SCALING.PRICE_SCALE_FACTOR)

    // Case 1: Clearing price exactly at this bar
    if (Math.abs(barTimeScaled - clearingPriceScaled) < positionTolerance) {
      return getBarCenter(bar.column)
    }

    // Case 2: Clearing price between this bar and next
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!nextBar || !nextBar.column) {
      continue
    }

    const nextBarTimeScaled = Math.round(nextBar.tickValue * COORDINATE_SCALING.PRICE_SCALE_FACTOR)

    if (barTimeScaled <= clearingPriceScaled && clearingPriceScaled <= nextBarTimeScaled) {
      return interpolateBarPosition({
        clearingPriceScaled,
        bar1: { tickValue: barTimeScaled, column: bar.column },
        bar2: { tickValue: nextBarTimeScaled, column: nextBar.column },
      })
    }
  }

  // Case 3: Position not found
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
  clearingPriceScaled: number
  bar1: { tickValue: number; column: { left: number; right: number } }
  bar2: { tickValue: number; column: { left: number; right: number } }
}

/**
 * Interpolates the X position between two bars based on clearing price ratio.
 *
 * Uses linear interpolation to find the exact position where the clearing price
 * line should be drawn when it falls between two bar positions.
 *
 * @param params - Interpolation parameters
 * @returns Interpolated X-coordinate in pixels
 *
 * @example
 * ```typescript
 * // Clearing price at 1.5, bar1 at 1.0, bar2 at 2.0
 * // Returns position 50% between the two bars
 * interpolateBarPosition({
 *   clearingPriceScaled: 15000,
 *   bar1: { tickValue: 10000, column: { left: 10, right: 20 } },
 *   bar2: { tickValue: 20000, column: { left: 30, right: 40 } }
 * })
 * ```
 */
function interpolateBarPosition(params: InterpolateBarPositionParams): number {
  const { clearingPriceScaled, bar1, bar2 } = params

  // Guard against division by zero when bars have identical tick values
  if (bar2.tickValue === bar1.tickValue) {
    return getBarCenter(bar1.column)
  }

  // Calculate ratio: how far between bar1 and bar2 is the clearing price?
  const ratio = (clearingPriceScaled - bar1.tickValue) / (bar2.tickValue - bar1.tickValue)

  // Get center positions of both bars
  const bar1CenterX = getBarCenter(bar1.column)
  const bar2CenterX = getBarCenter(bar2.column)

  // Linear interpolation between the two centers
  return bar1CenterX + ratio * (bar2CenterX - bar1CenterX)
}
