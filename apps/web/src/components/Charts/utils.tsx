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

/**
 * Custom time formatter used to customize tick mark labels on the time scale.
 * Follows the function signature of lightweight-charts' TickMarkFormatter.
 */
// eslint-disable-next-line consistent-return, max-params
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radii)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}
