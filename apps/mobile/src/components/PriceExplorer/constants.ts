import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import i18n from 'wallet/src/i18n/i18n'
import { ElementName } from 'wallet/src/telemetry/constants'

export const NUM_GRAPHS = 5

export const BUTTON_PADDING = 20

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6
export const LINE_WIDTH = 1

export const TIME_RANGES = [
  [
    HistoryDuration.Hour,
    i18n.t('token.priceExplorer.timeRangeLabel.hour'),
    ElementName.TimeFrame1H,
  ],
  [HistoryDuration.Day, i18n.t('token.priceExplorer.timeRangeLabel.day'), ElementName.TimeFrame1D],
  [
    HistoryDuration.Week,
    i18n.t('token.priceExplorer.timeRangeLabel.week'),
    ElementName.TimeFrame1W,
  ],
  [
    HistoryDuration.Month,
    i18n.t('token.priceExplorer.timeRangeLabel.month'),
    ElementName.TimeFrame1M,
  ],
  [
    HistoryDuration.Year,
    i18n.t('token.priceExplorer.timeRangeLabel.year'),
    ElementName.TimeFrame1Y,
  ],
] as const
