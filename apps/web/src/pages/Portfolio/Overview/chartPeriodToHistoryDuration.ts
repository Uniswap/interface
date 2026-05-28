import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'

export function chartPeriodToHistoryDuration(period: ChartPeriod): GraphQLApi.HistoryDuration {
  switch (period) {
    case ChartPeriod.HOUR:
      return GraphQLApi.HistoryDuration.Hour
    case ChartPeriod.DAY:
      return GraphQLApi.HistoryDuration.Day
    case ChartPeriod.WEEK:
      return GraphQLApi.HistoryDuration.Week
    case ChartPeriod.MONTH:
      return GraphQLApi.HistoryDuration.Month
    case ChartPeriod.YEAR:
      return GraphQLApi.HistoryDuration.Year
    case ChartPeriod.MAX:
      return GraphQLApi.HistoryDuration.Max
    default:
      return GraphQLApi.HistoryDuration.Day
  }
}
