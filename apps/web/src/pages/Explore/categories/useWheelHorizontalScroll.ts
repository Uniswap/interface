import { useEffect, useRef, useState } from 'react'
import type { TamaguiElement } from 'ui/src'

const SCROLL_EDGE_TOLERANCE_PX = 1
/** Approximate px per line when `WheelEvent.deltaMode` is `DOM_DELTA_LINE` (common on Windows). */
const WHEEL_LINE_HEIGHT_PX = 40

function wheelDeltaYToPixels(event: WheelEvent, containerWidthPx: number): number {
  const { deltaMode, deltaY } = event
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return deltaY * WHEEL_LINE_HEIGHT_PX
  }
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return deltaY * containerWidthPx
  }
  return deltaY
}

/**
 * Horizontal-scroll behavior for an overflow-x container:
 * - Redirects vertical mouse-wheel input to horizontal scrolling, so plain mice (no horizontal
 *   wheel/trackpad gesture) can scroll it. Native horizontal deltas are left to the browser.
 *   The wheel is only captured while the container can keep consuming it in that direction —
 *   at the edges the page scrolls normally.
 * - Tracks `showRightFade`: whether content remains off-screen to the right (drives the edge fade).
 */
export function useWheelHorizontalScroll(): {
  scrollerRef: React.RefObject<TamaguiElement | null>
  showRightFade: boolean
} {
  const scrollerRef = useRef<TamaguiElement>(null)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const node = scrollerRef.current
    if (!(node instanceof HTMLElement)) {
      return undefined
    }

    const updateRightFade = (): void => {
      const distanceFromEnd = node.scrollWidth - node.clientWidth - node.scrollLeft
      setShowRightFade(distanceFromEnd > SCROLL_EDGE_TOLERANCE_PX)
    }

    // React attaches wheel listeners passively, so preventDefault requires a manual non-passive listener.
    const onWheel = (event: WheelEvent): void => {
      const maxScrollLeft = node.scrollWidth - node.clientWidth
      if (maxScrollLeft <= 0 || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
        return
      }
      const canConsume =
        event.deltaY > 0 ? Math.round(node.scrollLeft) < maxScrollLeft : Math.round(node.scrollLeft) > 0
      if (!canConsume) {
        return
      }
      event.preventDefault()
      const deltaY = wheelDeltaYToPixels(event, node.clientWidth)
      node.scrollLeft = Math.max(0, Math.min(maxScrollLeft, node.scrollLeft + deltaY))
    }

    updateRightFade()
    node.addEventListener('wheel', onWheel, { passive: false })
    node.addEventListener('scroll', updateRightFade, { passive: true })
    const resizeObserver = new ResizeObserver(updateRightFade)
    resizeObserver.observe(node)

    return () => {
      node.removeEventListener('wheel', onWheel)
      node.removeEventListener('scroll', updateRightFade)
      resizeObserver.disconnect()
    }
  }, [])

  return { scrollerRef, showRightFade }
}
