import {
  CHART_BEHAVIOR,
  CHART_DIMENSIONS,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'

/**
 * Calculates zoom and pan parameters to fit a price range in the viewport
 */
export const calculateRangeViewport = ({
  minTickIndex,
  maxTickIndex,
  liquidityData,
  dynamicZoomMin,
  dimensions,
}: {
  minTickIndex: number
  maxTickIndex: number
  liquidityData: ChartEntry[]
  dynamicZoomMin: number
  dimensions: { width: number; height: number }
}) => {
  // Calculate the range in tick space
  const rangeCenterIndex = (minTickIndex + maxTickIndex) / 2
  const rangeSpanInTicks = Math.abs(maxTickIndex - minTickIndex) || liquidityData.length

  // Calculate zoom level to fit the range in viewport with padding
  const viewportHeight = dimensions.height
  const barHeight = CHART_DIMENSIONS.LIQUIDITY_BAR_HEIGHT + CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING
  const ticksVisibleInViewport = viewportHeight / barHeight
  const paddingFactor = 1.25 // Show 25% more than the range for context
  const requiredTicks = rangeSpanInTicks * paddingFactor

  // Calculate zoom: if we need to show more ticks than viewport can handle at 1x,
  // we need to zoom OUT (zoom < 1), but not below dynamicZoomMin
  const targetZoom = Math.max(Math.min(ticksVisibleInViewport / requiredTicks, CHART_BEHAVIOR.ZOOM_MAX), dynamicZoomMin)

  // Calculate panY to center the range with the new zoom level
  const rangeCenterY = (liquidityData.length - 1 - rangeCenterIndex) * barHeight * targetZoom
  const targetPanY = viewportHeight / 2 - rangeCenterY

  return {
    targetZoom,
    targetPanY,
  }
}
