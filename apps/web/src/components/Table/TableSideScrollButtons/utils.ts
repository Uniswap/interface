export const SCROLL_EDGE_TOLERANCE_PX = 1

/** Matches `TableScrollButton`, whose press the pinned-column collapse reads as the user scrolling. */
export const TABLE_SCROLL_BUTTON_SELECTOR = '[data-table-scroll-button]'

/** Spacer TableHead renders above a sticky header (`<Flex height={12} />`) — keep in sync. */
const STICKY_HEADER_GAP_PX = 12

export function calculateScrollButtonTop(params: {
  maxHeight?: number
  isSticky: boolean
  centerArrows: boolean
  height: number
  headerHeight: number
}): number {
  const { maxHeight, isSticky, centerArrows, height, headerHeight } = params
  const tableCenteredTop = height / 2

  // When centerArrows is true, center based on table height
  if (centerArrows && height > 0) {
    return tableCenteredTop
  }

  // When maxHeight is set but centerArrows is false, still use table height
  // (container-based positioning)
  if (maxHeight) {
    return tableCenteredTop
  }

  // When sticky and centerArrows is false, center on the viewport — clamped to the table's own
  // height so short window-scroll tables keep the arrows on the table instead of below it
  if (isSticky) {
    const viewportCenteredTop = (window.innerHeight - (headerHeight + STICKY_HEADER_GAP_PX)) / 2
    return height > 0 ? Math.min(viewportCenteredTop, tableCenteredTop) : viewportCenteredTop
  }

  return 0
}
