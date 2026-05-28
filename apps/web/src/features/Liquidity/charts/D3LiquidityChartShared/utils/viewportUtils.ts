import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { CHART_BEHAVIOR, CHART_DIMENSIONS } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'

/**
 * Calculate the maximum zoom level for horizontal chart where bars stay reasonable width.
 *
 * At max zoom, the smallest bucket is one tickSpacing wide, so:
 * maxZoom = (MAX_BAR_HEIGHT + BARS_SPACING) * fullTickRange / (tickSpacing * chartWidth)
 */
export function calculateHorizontalMaxZoom(tickSpacing: number, chartWidth: number): number {
  const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const fullTickRange = fullMaxTick - fullMinTick

  return ((CHART_BEHAVIOR.MAX_BAR_HEIGHT + CHART_BEHAVIOR.DESIRED_BUCKETS) * fullTickRange) / (tickSpacing * chartWidth)
}

/**
 * Calculates zoom and pan parameters to fit a tick range in the horizontal viewport.
 *
 * @param minTick - Lower bound of the target range
 * @param maxTick - Upper bound of the target range
 * @param tickSpacing - Pool's tick spacing
 * @param chartWidth - Width of the chart viewport
 */
export function calculateHorizontalViewport({
  minTick,
  maxTick,
  tickSpacing,
  chartWidth,
}: {
  minTick?: number
  maxTick?: number
  tickSpacing: number
  chartWidth: number
}): { targetZoom: number; targetPanX: number } {
  const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const fullTickRange = fullMaxTick - fullMinTick

  if (minTick === undefined || maxTick === undefined) {
    return {
      targetZoom: 1,
      targetPanX: 0,
    }
  }

  const targetTickRange = maxTick - minTick
  const paddingFactor = 1.5
  const paddedRange = targetTickRange * paddingFactor

  const maxZoom = calculateHorizontalMaxZoom(tickSpacing, chartWidth)
  const targetZoom = Math.max(Math.min(fullTickRange / paddedRange, maxZoom), CHART_BEHAVIOR.ZOOM_MIN)

  const centerTick = (minTick + maxTick) / 2
  const scaledWidth = chartWidth * targetZoom

  const targetPanX = chartWidth / 2 - ((centerTick - fullMinTick) / fullTickRange) * scaledWidth

  return {
    targetZoom,
    targetPanX,
  }
}

/**
 * Calculate the maximum zoom level for vertical chart where liquidity bars stay within MAX_BAR_HEIGHT.
 *
 * Bar height = bucketTickRange / fullTickRange * CHART_HEIGHT * zoomLevel - BARS_SPACING
 * At max zoom, the smallest bucket is one tickSpacing wide, so:
 * maxZoom = (MAX_BAR_HEIGHT + BARS_SPACING) * fullTickRange / (tickSpacing * CHART_HEIGHT)
 */
export function calculateMaxZoom(tickSpacing: number): number {
  const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const fullTickRange = fullMaxTick - fullMinTick

  return (
    ((CHART_BEHAVIOR.MAX_BAR_HEIGHT + CHART_DIMENSIONS.LIQUIDITY_BARS_SPACING) * fullTickRange) /
    (tickSpacing * CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT)
  )
}

/**
 * Calculates zoom and pan parameters to fit a tick range in the vertical viewport.
 *
 * @param minTick - Lower bound of the target range
 * @param maxTick - Upper bound of the target range
 * @param tickSpacing - Pool's tick spacing (default 60)
 */
export const calculateRangeViewport = ({
  minTick,
  maxTick,
  tickSpacing,
}: {
  minTick?: number
  maxTick?: number
  tickSpacing: number
}) => {
  const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const fullTickRange = fullMaxTick - fullMinTick

  if (minTick === undefined || maxTick === undefined) {
    return {
      targetZoom: 1,
      targetPanY: 0,
    }
  }

  const targetTickRange = maxTick - minTick
  const paddingFactor = 1.5
  const paddedRange = targetTickRange * paddingFactor

  const maxZoom = calculateMaxZoom(tickSpacing)
  const targetZoom = Math.max(Math.min(fullTickRange / paddedRange, maxZoom), CHART_BEHAVIOR.ZOOM_MIN)

  const centerTick = (minTick + maxTick) / 2
  const viewportHeight = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT
  const scaledHeight = viewportHeight * targetZoom

  const targetPanY = viewportHeight / 2 - ((fullMaxTick - centerTick) / fullTickRange) * scaledHeight

  return {
    targetZoom,
    targetPanY,
  }
}
