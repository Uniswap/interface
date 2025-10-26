import { GraphQLApi } from '@universe/api'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'

export const BUTTON_PADDING = 20

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6

export const TIME_RANGES = [
  [GraphQLApi.HistoryDuration.Hour, i18n.t('token.priceExplorer.timeRangeLabel.hour'), ElementName.TimeFrame1H],
  [GraphQLApi.HistoryDuration.Day, i18n.t('token.priceExplorer.timeRangeLabel.day'), ElementName.TimeFrame1D],
  [GraphQLApi.HistoryDuration.Week, i18n.t('token.priceExplorer.timeRangeLabel.week'), ElementName.TimeFrame1W],
  [GraphQLApi.HistoryDuration.Month, i18n.t('token.priceExplorer.timeRangeLabel.month'), ElementName.TimeFrame1M],
  [GraphQLApi.HistoryDuration.Year, i18n.t('token.priceExplorer.timeRangeLabel.year'), ElementName.TimeFrame1Y],
  [GraphQLApi.HistoryDuration.Max, i18n.t('common.all'), ElementName.TimeFrameAll],
] as const

export const NUM_GRAPHS = TIME_RANGES.length
