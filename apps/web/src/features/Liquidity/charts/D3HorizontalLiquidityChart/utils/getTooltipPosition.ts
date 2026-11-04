const TOOLTIP_OFFSET = 12

/**
 * Places the hover tooltip next to the cursor, clamped inside the chart. The top bound is `topInset`
 * rather than 0 because the overlaid chart header sits above the tooltip in z-order and would
 * otherwise paint its price text over it.
 */
export function getTooltipPosition({
  hoveredX,
  hoveredY,
  tooltipWidth,
  tooltipHeight,
  chartWidth,
  chartHeight,
  topInset,
}: {
  hoveredX: number
  hoveredY: number
  tooltipWidth: number
  tooltipHeight: number
  chartWidth: number
  chartHeight: number
  topInset: number
}): { x: number; y: number } {
  let x = hoveredX + TOOLTIP_OFFSET
  if (x + tooltipWidth > chartWidth) {
    x = hoveredX - tooltipWidth - TOOLTIP_OFFSET
  }
  x = Math.max(0, x)

  let y = hoveredY - TOOLTIP_OFFSET
  if (y + tooltipHeight > chartHeight) {
    y = chartHeight - tooltipHeight
  }
  y = Math.max(topInset, y)

  return { x, y }
}
