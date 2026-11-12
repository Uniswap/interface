import { AreaData, CandlestickData, UTCTimestamp } from 'lightweight-charts'
import ms from 'ms'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currentTimeInSeconds } from 'utilities/src/time/time'

export type PriceChartData = CandlestickData<UTCTimestamp> & AreaData<UTCTimestamp>

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
  /** True when the underlying query failed, distinguishing a fetch failure from a token with no data to plot. */
  isError?: boolean
}

export enum DataQuality {
  VALID = 0,
  INVALID = 1,
  STALE = 2,
}

/** Used decreasing freshness regardless of time period, e.g. 1h volume chart has more recent data than 1y volume chart */
const GRANULAR_STALENESS: Partial<Record<HistoryDuration, number>> = {
  [HistoryDuration.Hour]: ms('15m'),
  [HistoryDuration.Day]: ms('4h'),
  [HistoryDuration.Week]: ms('1d'),
  [HistoryDuration.Month]: ms('4d'),
  [HistoryDuration.Year]: ms('30d'),
}

/** Maps from `ChartType` and `HistoryDuration` to expected data freshness threshold */
const CHART_DURATION_STALE_THRESHOLD_MAP: Record<ChartType, Partial<Record<HistoryDuration, number> | undefined>> = {
  // Price chart appends a live spot-price point stamped to "now" (see appendLiveSpotPriceEntry), so this
  // threshold is only hit as a fallback when that append no-ops (e.g. current price momentarily unavailable).
  // GRANULAR_STALENESS avoids treating a coarser Week/Month/Year bucket as stale in that fallback case.
  [ChartType.PRICE]: GRANULAR_STALENESS,
  [ChartType.VOLUME]: GRANULAR_STALENESS,
  [ChartType.TVL]: GRANULAR_STALENESS,
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
  duration: HistoryDuration
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

/** Current time as lightweight-charts UTCTimestamp (whole seconds since epoch). */
export function getCurrentUTCTimestamp(): UTCTimestamp {
  // lightweight-charts requires integer UTCTimestamps; Date.now() is millisecond-precision,
  // so floor to whole seconds to avoid fractional times in the chart series.
  return currentTimeInSeconds() as UTCTimestamp
}
