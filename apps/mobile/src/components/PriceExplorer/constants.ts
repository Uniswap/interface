import type { TFunction } from 'i18next'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export const TIME_RANGES = [
  [HistoryDuration.Hour, ElementName.TimeFrame1H],
  [HistoryDuration.Day, ElementName.TimeFrame1D],
  [HistoryDuration.Week, ElementName.TimeFrame1W],
  [HistoryDuration.Month, ElementName.TimeFrame1M],
  [HistoryDuration.Year, ElementName.TimeFrame1Y],
  [HistoryDuration.Max, ElementName.TimeFrameAll],
] as const

export function historyDurationToLabel(t: TFunction, duration: HistoryDuration): string {
  switch (duration) {
    case HistoryDuration.Hour:
      return t('token.priceExplorer.timeRangeLabel.hour')
    case HistoryDuration.Day:
      return t('token.priceExplorer.timeRangeLabel.day')
    case HistoryDuration.Week:
      return t('token.priceExplorer.timeRangeLabel.week')
    case HistoryDuration.Month:
      return t('token.priceExplorer.timeRangeLabel.month')
    case HistoryDuration.Year:
      return t('token.priceExplorer.timeRangeLabel.year')
    case HistoryDuration.Max:
      return t('common.all')
    default:
      return ''
  }
}
