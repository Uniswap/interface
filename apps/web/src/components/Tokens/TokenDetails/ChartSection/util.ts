import { ChartType } from 'components/Charts/utils'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { UTCTimestamp } from 'lightweight-charts'
import ms from 'ms'

export type ChartQueryResult<TDataType, TChartType extends ChartType> = {
  chartType: TChartType
  entries: TDataType[]
  loading: boolean
  dataQuality: DataQuality
}

export enum DataQuality {
  VALID,
  INVALID,
  STALE,
}

/** Used for expecting the same data freshness regardless of time period, e.g. 1y price chart should still have a recent point */
const CONSTANT_STALENESS: Partial<Record<HistoryDuration, number>> = {
  [HistoryDuration.Hour]: ms('15m'),
  [HistoryDuration.Day]: ms('15m'),
  [HistoryDuration.Week]: ms('15m'),
  [HistoryDuration.Month]: ms('15m'),
  [HistoryDuration.Year]: ms('15m'),
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
  [ChartType.PRICE]: CONSTANT_STALENESS,
  [ChartType.VOLUME]: GRANULAR_STALENESS,
  [ChartType.TVL]: CONSTANT_STALENESS,
  // Liquidity chart does not have a time axis
  [ChartType.LIQUIDITY]: undefined,
}

export function checkDataQuality(
  data: { time: number }[],
  chartType: ChartType,
  duration: HistoryDuration
): DataQuality {
  if (data.length < 3) return DataQuality.INVALID
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
