import type { MyceliumElement } from '@universe/mycelium'
import { useEffect, useState } from 'react'

const SCROLL_EDGE_TOLERANCE_PX = 1
/** Approximate px per line when `WheelEvent.deltaMode` is `DOM_DELTA_LINE` (common on Windows). */
const WHEEL_LINE_HEIGHT_PX = 40

const EDGE_FADE_WIDTH_PX = 24

export interface EdgeFades {
  left: boolean
  right: boolean
}

/** Which edges have content scrolled out of view past them. */
export function getEdgeFades({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}): EdgeFades {
  return {
    left: scrollLeft > SCROLL_EDGE_TOLERANCE_PX,
    right: scrollWidth - clientWidth - scrollLeft > SCROLL_EDGE_TOLERANCE_PX,
  }
}

/** A mask (not a painted gradient) so the fade blends with any background. */
export function edgeFadeMaskStyle({
  left,
  right,
}: EdgeFades): { maskImage: string; WebkitMaskImage: string } | undefined {
  if (!left && !right) {
    return undefined
  }
  const stops = [
    ...(left ? ['transparent', `black ${EDGE_FADE_WIDTH_PX}px`] : []),
    ...(right ? [`black calc(100% - ${EDGE_FADE_WIDTH_PX}px)`, 'transparent'] : []),
  ]
  const mask = `linear-gradient(to right, ${stops.join(', ')})`
  return { maskImage: mask, WebkitMaskImage: mask }
}

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
 * - Tracks `edgeFades`: which edges have content off-screen past them (drives the edge fades).
 *
 * `scrollerRef` is a callback ref so a scroller that mounts after the first render (or is attached
 * conditionally) still gets wired up.
 */
export function useHorizontalScrollFades(): {
  scrollerRef: (node: MyceliumElement | null) => void
  edgeFades: EdgeFades
} {
  const [node, scrollerRef] = useState<MyceliumElement | null>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    if (!(node instanceof HTMLElement)) {
      return undefined
    }

    const updateEdgeFades = (): void => {
      const { left, right } = getEdgeFades(node)
      setShowLeftFade(left)
      setShowRightFade(right)
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

    updateEdgeFades()
    node.addEventListener('wheel', onWheel, { passive: false })
    node.addEventListener('scroll', updateEdgeFades, { passive: true })
    const resizeObserver = new ResizeObserver(updateEdgeFades)
    resizeObserver.observe(node)

    return () => {
      node.removeEventListener('wheel', onWheel)
      node.removeEventListener('scroll', updateEdgeFades)
      resizeObserver.disconnect()
    }
  }, [node])

  return { scrollerRef, edgeFades: { left: showLeftFade, right: showRightFade } }
}
