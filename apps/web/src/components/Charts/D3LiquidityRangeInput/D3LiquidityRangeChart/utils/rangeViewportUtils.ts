import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import {
  CHART_BEHAVIOR,
  CHART_DIMENSIONS,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'

/**
 * Calculate the maximum zoom level where liquidity bars stay within MAX_BAR_HEIGHT.
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
 * Calculates zoom and pan parameters to fit a tick range in the viewport.
 *
 * The chart uses a continuous tick scale:
 * - Full tick range: MIN_TICK to MAX_TICK (~1.77M ticks)
 * - At zoomLevel=1: Full range fits in viewport
 * - At zoomLevel>1: Zoomed in, showing fewer ticks
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
  // Full pool tick range (aligned to tick spacing)
  const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)
  const fullTickRange = fullMaxTick - fullMinTick

  // If no range specified, show full range at zoom level 1
  if (minTick === undefined || maxTick === undefined) {
    return {
      targetZoom: 1,
      targetPanY: 0,
    }
  }

  // Calculate target range with padding (25% extra on each side)
  const targetTickRange = maxTick - minTick
  const paddingFactor = 1.5 // Show 50% more than the range for context
  const paddedRange = targetTickRange * paddingFactor

  // Calculate zoom level to fit the padded range in viewport
  // At zoomLevel=1, full range fits. To show a smaller range, we need higher zoom.
  // zoomLevel = fullTickRange / visibleTickRange
  const maxZoom = calculateMaxZoom(tickSpacing)
  const targetZoom = Math.max(Math.min(fullTickRange / paddedRange, maxZoom), CHART_BEHAVIOR.ZOOM_MIN)

  // Calculate panY to center the target range in viewport
  // The tick scale maps: fullMaxTick -> y=panY, fullMinTick -> y=scaledHeight+panY
  // To center a tick, we need: tickToY(centerTick) = viewportHeight/2
  //
  // tickToY(tick) = panY + (fullMaxTick - tick) / fullTickRange * scaledHeight
  // where scaledHeight = CHART_HEIGHT * zoomLevel
  //
  // Setting tickToY(centerTick) = viewportHeight/2 and solving for panY:
  // panY = viewportHeight/2 - (fullMaxTick - centerTick) / fullTickRange * scaledHeight

  const centerTick = (minTick + maxTick) / 2
  const viewportHeight = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT
  const scaledHeight = viewportHeight * targetZoom

  const targetPanY = viewportHeight / 2 - ((fullMaxTick - centerTick) / fullTickRange) * scaledHeight

  return {
    targetZoom,
    targetPanY,
  }
}
