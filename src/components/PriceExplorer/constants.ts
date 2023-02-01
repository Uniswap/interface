import { HistoryDuration } from 'src/data/__generated__/types-and-hooks'
import { dimensions } from 'src/styles/sizing'
import { theme as FixedTheme } from 'src/styles/theme'

// sets the height of the chart short enough on small devices that the
// "Your balance" section will always show above the fold
// we can't use useResponsiveProps for this because CHART_HEIGHT gets
// used in non-component code related to chart functionality
export const CHART_HEIGHT = dimensions.fullHeight < FixedTheme.breakpoints.sm.height ? 180 : 310
export const CHART_WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5

export const BUTTON_PADDING = 20
export const BUTTON_WIDTH = CHART_WIDTH / NUM_GRAPHS
export const LABEL_WIDTH = BUTTON_WIDTH - BUTTON_PADDING * 2

export const CURSOR_INNER_SIZE = 12
export const CURSOR_SIZE = CURSOR_INNER_SIZE + 6
export const LINE_WIDTH = 1

export const TIME_RANGES = [
  [HistoryDuration.Hour, '1H'],
  [HistoryDuration.Day, '1D'],
  [HistoryDuration.Week, '1W'],
  [HistoryDuration.Month, '1M'],
  [HistoryDuration.Year, '1Y'],
] as const
