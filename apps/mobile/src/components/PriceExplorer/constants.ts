import { GraphQLApi } from '@universe/api'
import type { TFunction } from 'i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export const BUTTON_PADDING = 20

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6

export const TIME_RANGES = [
  [GraphQLApi.HistoryDuration.Hour, ElementName.TimeFrame1H],
  [GraphQLApi.HistoryDuration.Day, ElementName.TimeFrame1D],
  [GraphQLApi.HistoryDuration.Week, ElementName.TimeFrame1W],
  [GraphQLApi.HistoryDuration.Month, ElementName.TimeFrame1M],
  [GraphQLApi.HistoryDuration.Year, ElementName.TimeFrame1Y],
  [GraphQLApi.HistoryDuration.Max, ElementName.TimeFrameAll],
] as const

export const NUM_GRAPHS = TIME_RANGES.length

export function historyDurationToLabel(t: TFunction, duration: GraphQLApi.HistoryDuration): string {
  switch (duration) {
    case GraphQLApi.HistoryDuration.Hour:
      return t('token.priceExplorer.timeRangeLabel.hour')
    case GraphQLApi.HistoryDuration.Day:
      return t('token.priceExplorer.timeRangeLabel.day')
    case GraphQLApi.HistoryDuration.Week:
      return t('token.priceExplorer.timeRangeLabel.week')
    case GraphQLApi.HistoryDuration.Month:
      return t('token.priceExplorer.timeRangeLabel.month')
    case GraphQLApi.HistoryDuration.Year:
      return t('token.priceExplorer.timeRangeLabel.year')
    case GraphQLApi.HistoryDuration.Max:
      return t('common.all')
    default:
      return ''
  }
}
