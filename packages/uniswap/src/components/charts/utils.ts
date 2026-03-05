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
