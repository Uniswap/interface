import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { heightBreakpoints } from 'ui/src/theme'

type ChartDimensions = {
  chartHeight: number
  chartWidth: number
}

// TODO (MOB-1387): account for height in a more dynamic way to ensure
// that "Your balance" section will always show above the fold
export function useChartDimensions(): ChartDimensions {
  const { fullHeight, fullWidth } = useDeviceDimensions()

  const chartHeight = fullHeight < heightBreakpoints.short ? 130 : 215
  const chartWidth = fullWidth

  return {
    chartHeight,
    chartWidth,
  }
}
