import { HistoryDuration } from 'uniswap/src/features/dataApi/types'

// Percent of min. Kept at 0.5% on 1H/1D too: 1.5% flattened majors like ETH/BTC on quiet days
const STABLECOIN_VARIANCE_THRESHOLDS: Record<HistoryDuration, number> = {
  [HistoryDuration.Hour]: 0.5,
  [HistoryDuration.Day]: 0.5,
  [HistoryDuration.Week]: 0.5,
  [HistoryDuration.Month]: 0.5,
  [HistoryDuration.Year]: 0.5,
  [HistoryDuration.Max]: 0.5,
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
  duration?: HistoryDuration
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

/**
 * Appends the current spot price to the end of a historical price series, so the chart line stays
 * fresh between backend refetches instead of ending at the last completed bucket. If the spot price
 * falls within the same time window as the last entry, that entry is updated in place; otherwise a
 * new trailing entry is added. No-ops when there's no price or fewer than two entries (not enough to
 * infer the series' time granularity), or when the device clock is behind the last server entry.
 *
 * Platform-agnostic: callers supply accessors/factories so this works with any chart point shape
 * (e.g. web's OHLC `PriceChartData` keyed by `time`, or mobile's `{ timestamp, value }` line points).
 * `TTime` lets branded timestamp types (web's lightweight-charts `UTCTimestamp`) flow from `now`
 * into the factories uncast. Returns a new array/entry rather than mutating in place, since callers
 * may hold entries shared elsewhere (e.g. react-query's cached `select` output).
 */
export function appendLiveSpotPriceEntry<T, TTime extends number = number>({
  entries,
  currentPrice,
  now,
  getTime,
  createEntry,
  updateEntry,
}: {
  entries: T[]
  currentPrice: number | undefined
  now: TTime
  getTime: (entry: T) => number
  createEntry: (params: { time: TTime; price: number }) => T
  updateEntry: (entry: T, params: { time: TTime; price: number }) => T
}): T[] {
  if (!currentPrice || entries.length < 2) {
    return entries
  }

  const lastEntry = entries[entries.length - 1]
  const secondToLastEntry = entries[entries.length - 2]
  if (lastEntry === undefined || secondToLastEntry === undefined) {
    return entries
  }

  const lastTimestamp = getTime(lastEntry)
  // A lagging device clock must not move the tail backwards and break chronological chart lookups.
  if (now < lastTimestamp) {
    return entries
  }

  const granularity = lastTimestamp - getTime(secondToLastEntry)
  if (now - lastTimestamp < granularity) {
    return [...entries.slice(0, -1), updateEntry(lastEntry, { time: now, price: currentPrice })]
  }
  return [...entries, createEntry({ time: now, price: currentPrice })]
}
