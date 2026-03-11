export const SCROLL_EDGE_TOLERANCE_PX = 1

export function calculateScrollButtonTop(params: {
  maxHeight?: number
  isSticky: boolean
  centerArrows: boolean
  height: number
  headerHeight: number
}): number {
  const { maxHeight, isSticky, centerArrows, height, headerHeight } = params

  // When centerArrows is true, center based on table height
  if (centerArrows && height > 0) {
    return height / 2
  }

  // When maxHeight is set but centerArrows is false, still use table height
  // (container-based positioning)
  if (maxHeight) {
    return height / 2
  }

  // When sticky and centerArrows is false, use window-based calculation
  if (isSticky) {
    return (window.innerHeight - (headerHeight + 12)) / 2
  }

  return 0
}
