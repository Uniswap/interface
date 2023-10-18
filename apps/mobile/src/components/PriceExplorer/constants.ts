import { ElementName } from 'src/features/telemetry/constants'
import { HistoryDuration } from 'wallet/src/data/__generated__/types-and-hooks'

export const NUM_GRAPHS = 5

export const BUTTON_PADDING = 20

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6
export const LINE_WIDTH = 1

export const TIME_RANGES = [
  [HistoryDuration.Hour, '1H', ElementName.TimeFrame1H],
  [HistoryDuration.Day, '1D', ElementName.TimeFrame1D],
  [HistoryDuration.Week, '1W', ElementName.TimeFrame1W],
  [HistoryDuration.Month, '1M', ElementName.TimeFrame1M],
  [HistoryDuration.Year, '1Y', ElementName.TimeFrame1Y],
] as const
