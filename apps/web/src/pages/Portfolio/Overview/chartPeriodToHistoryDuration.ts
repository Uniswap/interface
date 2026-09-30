import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'

export function chartPeriodToHistoryDuration(period: ChartPeriod): HistoryDuration {
  switch (period) {
    case ChartPeriod.HOUR:
      return HistoryDuration.Hour
    case ChartPeriod.DAY:
      return HistoryDuration.Day
    case ChartPeriod.WEEK:
      return HistoryDuration.Week
    case ChartPeriod.MONTH:
      return HistoryDuration.Month
    case ChartPeriod.YEAR:
      return HistoryDuration.Year
    case ChartPeriod.MAX:
      return HistoryDuration.Max
    default:
      return HistoryDuration.Day
  }
}
