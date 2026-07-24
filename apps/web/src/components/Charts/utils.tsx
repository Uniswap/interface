import { GraphQLApi } from '@universe/api'
import { TickMarkType, UTCTimestamp } from 'lightweight-charts'
import ms from 'ms'

/** Compatible with ISeriesApi<'Area' | 'Candlestick'> */
export enum PriceChartType {
  LINE = 'Line chart',
  CANDLESTICK = 'Candlestick',
}

export enum ChartType {
  PRICE = 'Price',
  VOLUME = 'Volume',
  TVL = 'TVL', // Locked value distributed by timestamp
  LIQUIDITY = 'Liquidity', // Locked value distributed by tick
  DEPTH = 'Depth', // Cumulative liquidity depth (bid/ask)
}

export type ChartQueryResult<TDataType, TChartType extends ChartType> = {
  chartType: TChartType
  entries: TDataType[]
  loading: boolean
  dataQuality: DataQuality
  dataHash?: string
}

export enum DataQuality {
  VALID = 0,
  INVALID = 1,
  STALE = 2,
}

/** Used for expecting the same data freshness regardless of time period, e.g. 1y price chart should still have a recent point */
const CONSTANT_STALENESS: Partial<Record<GraphQLApi.HistoryDuration, number>> = {
  [GraphQLApi.HistoryDuration.Hour]: ms('15m'),
  [GraphQLApi.HistoryDuration.Day]: ms('15m'),
  [GraphQLApi.HistoryDuration.Week]: ms('15m'),
  [GraphQLApi.HistoryDuration.Month]: ms('15m'),
  [GraphQLApi.HistoryDuration.Year]: ms('15m'),
}

/** Used decreasing freshness regardless of time period, e.g. 1h volume chart has more recent data than 1y volume chart */
const GRANULAR_STALENESS: Partial<Record<GraphQLApi.HistoryDuration, number>> = {
  [GraphQLApi.HistoryDuration.Hour]: ms('15m'),
  [GraphQLApi.HistoryDuration.Day]: ms('4h'),
  [GraphQLApi.HistoryDuration.Week]: ms('1d'),
  [GraphQLApi.HistoryDuration.Month]: ms('4d'),
  [GraphQLApi.HistoryDuration.Year]: ms('30d'),
}

/** Maps from `ChartType` and `HistoryDuration` to expected data freshness threshold */
const CHART_DURATION_STALE_THRESHOLD_MAP: Record<
  ChartType,
  Partial<Record<GraphQLApi.HistoryDuration, number> | undefined>
> = {
  [ChartType.PRICE]: CONSTANT_STALENESS,
  [ChartType.VOLUME]: GRANULAR_STALENESS,
  [ChartType.TVL]: CONSTANT_STALENESS,
  // Liquidity chart does not have a time axis
  [ChartType.LIQUIDITY]: undefined,
  // Depth chart does not have a time axis
  [ChartType.DEPTH]: undefined,
}

export function checkDataQuality({
  data,
  chartType,
  duration,
}: {
  data: { time: number }[]
  chartType: ChartType
  duration: GraphQLApi.HistoryDuration
}): DataQuality {
  if (data.length < 3) {
    return DataQuality.INVALID
  }
  const timeInMs = data[data.length - 1].time * 1000
  const stalenessThreshold = CHART_DURATION_STALE_THRESHOLD_MAP[chartType]?.[duration]
  if (!stalenessThreshold || Date.now() - timeInMs < stalenessThreshold) {
    return DataQuality.VALID
  } else {
    return DataQuality.STALE
  }
}

export function withUTCTimestamp<T extends { timestamp: number }>(entry: T): T & { time: UTCTimestamp } {
  return { ...entry, time: entry.timestamp as UTCTimestamp }
}

/** Current time as lightweight-charts UTCTimestamp (whole seconds since epoch). */
export function getCurrentUTCTimestamp(): UTCTimestamp {
  // lightweight-charts requires integer UTCTimestamps; Date.now() is millisecond-precision,
  // so floor to whole seconds to avoid fractional times in the chart series.
  return Math.floor(Date.now() / 1000) as UTCTimestamp
}

const CANDLESTICK_FALLBACK_THRESHOLD = 0.1

/** Backend sometimes returns invalid OHLC data on some chains: a long run of 0-valued candles. Used to trigger a fallback to price history. */
export function isZeroOhlcSeries(entries: { value: number }[]): boolean {
  if (!entries.length) {
    return true
  }
  const zeroCount = entries.filter((entry) => entry.value === 0).length
  return zeroCount / entries.length > CANDLESTICK_FALLBACK_THRESHOLD
}

/**
 * Appends (or merges into) a fresh current-value point so the series stays fresh and each time
 * period ends with the same value. Returns a new array/entry rather than mutating in place, since
 * callers may hold entries shared elsewhere (e.g. react-query's cached `select` output).
 */
export function appendCurrentValue<T extends { time: UTCTimestamp }>({
  entries,
  currentValue,
  buildEntry,
  withCurrentValue,
}: {
  entries: T[]
  currentValue: number | undefined
  buildEntry: (time: UTCTimestamp, value: number) => T
  withCurrentValue: (entry: T, update: { time: UTCTimestamp; value: number }) => T
}): T[] {
  if (!currentValue || entries.length <= 1) {
    return entries
  }
  const lastEntry = entries[entries.length - 1]
  const secondToLastEntry = entries[entries.length - 2]
  const granularity = lastEntry.time - secondToLastEntry.time

  const time = getCurrentUTCTimestamp()
  // If the current value falls within the last entry's time window, update it; otherwise append a new entry.
  if (time - lastEntry.time < granularity) {
    return [...entries.slice(0, -1), withCurrentValue(lastEntry, { time, value: currentValue })]
  }
  return [...entries, buildEntry(time, currentValue)]
}

/**
 * Custom time formatter used to customize tick mark labels on the time scale.
 * Follows the function signature of lightweight-charts' TickMarkFormatter.
 */
// oxlint-disable-next-line typescript/consistent-return, max-params
export function formatTickMarks(time: UTCTimestamp, tickMarkType: TickMarkType, locale: string): string {
  const date = new Date(time.valueOf() * 1000)
  switch (tickMarkType) {
    case TickMarkType.Year:
      return date.toLocaleString(locale, { year: 'numeric' })
    case TickMarkType.Month:
      return date.toLocaleString(locale, { month: 'short', year: 'numeric' })
    case TickMarkType.DayOfMonth:
      return date.toLocaleString(locale, { month: 'short', day: 'numeric' })
    case TickMarkType.Time:
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric' })
    case TickMarkType.TimeWithSeconds:
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', second: '2-digit' })
  }
}

export function roundRect({
  ctx,
  x,
  y,
  w,
  h,
  radii,
}: {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  w: number
  h: number
  radii?: number | DOMPointInit | Iterable<number | DOMPointInit>
}): void {
  // roundRect might need to polyfilled for older browsers
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radii)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}
