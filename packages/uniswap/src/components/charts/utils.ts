import { GraphQLApi } from '@universe/api'

// Shorter timeframes use higher thresholds since stablecoins naturally show more price noise on smaller windows
const STABLECOIN_VARIANCE_THRESHOLDS: Record<GraphQLApi.HistoryDuration, number> = {
  [GraphQLApi.HistoryDuration.FiveMinute]: 1.5, // not used in the UI
  [GraphQLApi.HistoryDuration.Hour]: 1.5,
  [GraphQLApi.HistoryDuration.Day]: 1.5,
  [GraphQLApi.HistoryDuration.Week]: 0.5,
  [GraphQLApi.HistoryDuration.Month]: 0.5,
  [GraphQLApi.HistoryDuration.Year]: 0.5,
  [GraphQLApi.HistoryDuration.Max]: 0.5,
}

/**
 * Determines if a price range has low variance (typically indicating a stablecoin).
 * @param min - The minimum price value
 * @param max - The maximum price value
 * @param duration - The time period for the chart data (optional)
 * @returns true if the price variance is below the threshold
 */
export function isLowVarianceRange({
  min,
  max,
  duration,
}: {
  min: number
  max: number
  duration?: GraphQLApi.HistoryDuration
}): boolean {
  if (min <= 0) {
    return false
  }

  if (!duration) {
    return false
  }

  const priceRange = max - min
  const priceVariancePercent = (priceRange / min) * 100

  return priceVariancePercent < STABLECOIN_VARIANCE_THRESHOLDS[duration]
}

// A range is "low variance" once it spans less than this fraction of its own magnitude.
// Below this, magnitude-based formatters (which cap precision at 2-3 decimals near $1) collapse
// every gridline to the same label (e.g. a stablecoin axis reading "1.00" at every tick).
const AXIS_PRECISION_VARIANCE_THRESHOLD = 0.05
const MAX_AXIS_DECIMALS = 8

/**
 * For low-variance (e.g. stablecoin) price ranges, returns the number of decimal places needed so
 * adjacent y-axis gridlines render as distinct labels. Returns undefined for normal/wide ranges,
 * where the default magnitude-based formatting should be kept unchanged.
 */
export function getLowVarianceAxisDecimals(min: number, max: number): number | undefined {
  if (!(min > 0) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return undefined
  }

  const range = max - min
  if (range / min >= AXIS_PRECISION_VARIANCE_THRESHOLD) {
    return undefined
  }

  // One digit finer than the range's magnitude resolves the gridline spacing without over-cluttering.
  return Math.min(MAX_AXIS_DECIMALS, Math.max(2, Math.ceil(-Math.log10(range)) + 1))
}
