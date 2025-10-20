import {
  CHART_BEHAVIOR,
  CHART_DIMENSIONS,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'

/**
 * Calculate dynamic minimum zoom to fit all liquidity bars
 */
export const calculateDynamicZoomMin = (liquidityDataLength: number): number => {
  if (liquidityDataLength === 0) {
    return CHART_BEHAVIOR.ZOOM_MIN
  }

  const barHeight = CHART_DIMENSIONS.LIQUIDITY_BAR_HEIGHT + CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING
  const totalContentHeight = liquidityDataLength * barHeight
  const viewportHeight = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT

  const calculatedMin = viewportHeight / totalContentHeight

  return Math.max(CHART_BEHAVIOR.ZOOM_MIN, calculatedMin)
}
