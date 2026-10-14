/**
 * Width of the vertical scrollbar on the element's nearest scrollable ancestor. 0 for overlay scrollbars
 * and when the container doesn't currently overflow, since neither takes layout space.
 */
export function getScrollContainerScrollbarWidth(element: HTMLElement | null): number {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    const { overflowY, borderLeftWidth, borderRightWidth } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      const borders = (parseFloat(borderLeftWidth) || 0) + (parseFloat(borderRightWidth) || 0)
      return Math.max(0, node.offsetWidth - node.clientWidth - borders)
    }
  }
  return 0
}
