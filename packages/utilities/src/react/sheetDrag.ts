// Under the browser's ~8px pan slop, so the drag commits before the browser pointercancels it as a pan.
export const TOUCH_DRAG_SLOP_PX = 6

export function isInsideScroller({ target, frame }: { target: Element | null; frame: Element }): boolean {
  for (let element = target; element && element !== frame; element = element.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(element)
    const scrollsY = (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight
    const scrollsX = (overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth
    if (scrollsY || scrollsX) {
      return true
    }
  }
  return false
}
