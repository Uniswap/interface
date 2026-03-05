import { CHART_DIMENSIONS } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/constants'

/**
 * Calculates bounded panY to prevent scrolling beyond the tick range.
 *
 * The chart uses a continuous tick scale (MIN_TICK to MAX_TICK) mapped to a fixed height.
 * When zoomed in (zoomLevel > 1), the total content height increases, allowing panning.
 *
 * @param panY - The current pan Y position
 * @param viewportHeight - Height of the viewport
 * @param zoomLevel - Current zoom level (1 = full range visible, >1 = zoomed in)
 * @returns Bounded panY value
 */
export function boundPanY({
  panY,
  viewportHeight,
  zoomLevel,
}: {
  panY: number
  viewportHeight: number
  zoomLevel: number
}) {
  // Total content height is the chart height scaled by zoom level
  // At zoomLevel=1, content fits exactly in viewport (no panning)
  // At zoomLevel>1, content is larger than viewport (can pan)
  const totalContentHeight = CHART_DIMENSIONS.LIQUIDITY_CHART_HEIGHT * zoomLevel

  // Apply bounds:
  // - maxPanY = 0: Top of content (MAX_TICK) aligns with top of viewport
  // - minPanY: Bottom of content (MIN_TICK) aligns with bottom of viewport
  const minPanY = Math.min(0, viewportHeight - totalContentHeight)
  const maxPanY = 0

  return Math.max(minPanY, Math.min(maxPanY, panY))
}
