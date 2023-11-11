import { ElementName } from 'src/features/telemetry/constants'
import { HistoryDuration } from 'wallet/src/data/__generated__/types-and-hooks'
import i18n from 'wallet/src/i18n/i18n'

export const NUM_GRAPHS = 5

export const BUTTON_PADDING = 20

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6
export const LINE_WIDTH = 1

export const TIME_RANGES = [
  [HistoryDuration.Hour, i18n.t('1H'), ElementName.TimeFrame1H],
  [HistoryDuration.Day, i18n.t('1D'), ElementName.TimeFrame1D],
  [HistoryDuration.Week, i18n.t('1W'), ElementName.TimeFrame1W],
  [HistoryDuration.Month, i18n.t('1M'), ElementName.TimeFrame1M],
  [HistoryDuration.Year, i18n.t('1Y'), ElementName.TimeFrame1Y],
] as const
