import { useDeviceDimensions } from 'ui/src'
import { heightBreakpoints } from 'ui/src/theme'
import { BUTTON_PADDING, NUM_GRAPHS } from './constants'

export type ChartDimensions = {
  chartHeight: number
  chartWidth: number
  buttonWidth: number
  labelWidth: number
}

// TODO (MOB-1387): account for height in a more dynamic way to ensure
// that "Your balance" section will always show above the fold
export function useChartDimensions(): ChartDimensions {
  const { fullHeight, fullWidth } = useDeviceDimensions()

  const chartHeight = fullHeight < heightBreakpoints.short ? 130 : 215
  const chartWidth = fullWidth

  const buttonWidth = chartWidth / NUM_GRAPHS
  const labelWidth = buttonWidth - BUTTON_PADDING * 2

  return {
    chartHeight,
    chartWidth,
    buttonWidth,
    labelWidth,
  }
}
