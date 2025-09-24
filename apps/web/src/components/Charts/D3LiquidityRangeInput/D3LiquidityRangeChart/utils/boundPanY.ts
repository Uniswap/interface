import { CHART_DIMENSIONS } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'

/**
 * Calculates bounded panY to prevent liquidity bars from underflowing the viewport
 * @param panY - The current pan Y position
 * @param viewportHeight - Height of the viewport
 * @param liquidityData - Array of liquidity data entries
 * @param zoomLevel - Current zoom level
 * @returns Bounded panY value
 */
export function boundPanY({
  panY,
  viewportHeight,
  liquidityData,
  zoomLevel,
}: {
  panY: number
  viewportHeight: number
  liquidityData: ChartEntry[]
  zoomLevel: number
}) {
  const totalContentHeight =
    liquidityData.length * CHART_DIMENSIONS.LIQUIDITY_BAR_HEIGHT +
    (liquidityData.length - 1) * CHART_DIMENSIONS.LIQUIDITY_BAR_SPACING
  const totalContentHeightWithZoom = totalContentHeight * zoomLevel

  // Apply bounds: content should not go below viewport bottom or above viewport top
  const minPanY = Math.min(0, viewportHeight - totalContentHeightWithZoom)
  const maxPanY = 0

  return Math.max(minPanY, Math.min(maxPanY, panY))
}
