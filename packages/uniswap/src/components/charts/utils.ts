import { GraphQLApi } from '@universe/api'

const STABLECOIN_VARIANCE_PERCENT_THRESHOLD = 0.5

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

  // Always return false for 1H time windows
  if (duration === GraphQLApi.HistoryDuration.Hour) {
    return false
  }

  const priceRange = max - min
  const priceVariancePercent = (priceRange / min) * 100

  return priceVariancePercent < STABLECOIN_VARIANCE_PERCENT_THRESHOLD
}
