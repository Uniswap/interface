/**
 * Calculates bounded pan to prevent scrolling beyond the tick range.
 *
 * When zoomed in (zoomLevel > 1), the total content size increases, allowing panning.
 * At zoomLevel=1, content fits exactly in viewport (no panning).
 *
 * @param pan - The current pan position
 * @param viewportSize - Size of the viewport (width for horizontal, height for vertical)
 * @param contentSize - Base content size before zoom (for vertical charts this is LIQUIDITY_CHART_HEIGHT, for horizontal it equals viewportSize)
 * @param zoomLevel - Current zoom level (1 = full range visible, >1 = zoomed in)
 * @returns Bounded pan value
 */
export function boundPan({
  pan,
  viewportSize,
  contentSize,
  zoomLevel,
}: {
  pan: number
  viewportSize: number
  contentSize: number
  zoomLevel: number
}): number {
  const totalContentSize = contentSize * zoomLevel
  const minPan = Math.min(0, viewportSize - totalContentSize)
  const maxPan = 0

  return Math.max(minPan, Math.min(maxPan, pan))
}
