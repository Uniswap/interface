import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'

export const BUTTON_PADDING = 20

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6

export const TIME_RANGES = [
  [HistoryDuration.Hour, i18n.t('token.priceExplorer.timeRangeLabel.hour'), ElementName.TimeFrame1H],
  [HistoryDuration.Day, i18n.t('token.priceExplorer.timeRangeLabel.day'), ElementName.TimeFrame1D],
  [HistoryDuration.Week, i18n.t('token.priceExplorer.timeRangeLabel.week'), ElementName.TimeFrame1W],
  [HistoryDuration.Month, i18n.t('token.priceExplorer.timeRangeLabel.month'), ElementName.TimeFrame1M],
  [HistoryDuration.Year, i18n.t('token.priceExplorer.timeRangeLabel.year'), ElementName.TimeFrame1Y],
  [HistoryDuration.Max, i18n.t('common.all'), ElementName.TimeFrameAll],
] as const

export const NUM_GRAPHS = TIME_RANGES.length
