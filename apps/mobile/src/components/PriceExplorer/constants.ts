import { ElementName } from 'src/features/telemetry/constants'
import { dimensions, heightBreakpoints } from 'ui/src/theme'
import { HistoryDuration } from 'wallet/src/data/__generated__/types-and-hooks'

// TODO (MOB-1387): account for height in a more dynamic way to ensure
// that "Your balance" section will always show above the fold
export const CHART_HEIGHT = dimensions.fullHeight < heightBreakpoints.short ? 130 : 215
export const CHART_WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5

export const BUTTON_PADDING = 20
export const BUTTON_WIDTH = CHART_WIDTH / NUM_GRAPHS
export const LABEL_WIDTH = BUTTON_WIDTH - BUTTON_PADDING * 2

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
