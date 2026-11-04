import type { MyceliumElement } from '@universe/mycelium'
import { RefObject, useLayoutEffect, useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

// Breathing room to keep between the tabs and the right-side icons before collapsing.
const MIN_TAB_BAR_GAP = 8

export function shouldCollapseTabBar({
  naturalTabsWidth,
  rightContentWidth,
  containerWidth,
}: {
  naturalTabsWidth: number
  rightContentWidth: number
  containerWidth: number
}): boolean {
  return naturalTabsWidth + MIN_TAB_BAR_GAP + rightContentWidth > containerWidth
}

/**
 * Detects when a tab bar's natural width no longer fits next to its row's right-side content,
 * so the tabs can collapse into a dropdown (CONS-221: translated labels overlap the settings
 * icon). The trigger is label width — locale-dependent — so this measures rather than using a
 * viewport breakpoint.
 *
 * `measureKey` must change whenever the labels' natural width can change (i.e. the language).
 * The tabs unmount while collapsed, so their natural width is cached per key; on a key change
 * the tabs are remounted for one pre-paint layout pass to re-measure.
 */
export function useTabBarOverflow({ measureKey }: { measureKey: string }): {
  collapsed: boolean
  containerRef: RefObject<MyceliumElement | null>
  tabsRef: RefObject<MyceliumElement | null>
  rightContentRef: RefObject<MyceliumElement | null>
} {
  const containerRef = useRef<MyceliumElement>(null)
  const tabsRef = useRef<MyceliumElement>(null)
  const rightContentRef = useRef<MyceliumElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const naturalTabsWidths = useRef<Record<string, number | undefined>>({})
  // Right-side content varies per tab (settings gear only on Swap); compare against the widest
  // seen so the decision doesn't flip back and forth while switching tabs. Scoped to the
  // container width, since a resize can also drop right-side content (the chart toggle goes
  // away below `lg`) and a max held over from the wider layout would collapse the tabs earlier
  // than needed. Switching tabs leaves the container width alone, so the hysteresis survives it.
  const maxRightContentWidth = useRef(0)
  const lastContainerWidth = useRef(0)

  const measure = useEvent(() => {
    const container = containerRef.current
    if (!(container instanceof HTMLElement)) {
      return
    }
    const containerWidth = container.getBoundingClientRect().width
    // Not laid out (jsdom, display: none) — leave the tabs expanded.
    if (containerWidth === 0) {
      return
    }
    if (containerWidth !== lastContainerWidth.current) {
      lastContainerWidth.current = containerWidth
      maxRightContentWidth.current = 0
    }
    if (tabsRef.current instanceof HTMLElement) {
      naturalTabsWidths.current[measureKey] = tabsRef.current.getBoundingClientRect().width
    }
    if (rightContentRef.current instanceof HTMLElement) {
      maxRightContentWidth.current = Math.max(
        maxRightContentWidth.current,
        rightContentRef.current.getBoundingClientRect().width,
      )
    }
    const naturalTabsWidth = naturalTabsWidths.current[measureKey]
    if (naturalTabsWidth === undefined) {
      // Language changed while collapsed — expand to re-measure; the next layout pass
      // re-collapses before paint if the new labels still overflow.
      setCollapsed(false)
      return
    }
    setCollapsed(
      shouldCollapseTabBar({
        naturalTabsWidth,
        rightContentWidth: maxRightContentWidth.current,
        containerWidth,
      }),
    )
  })

  useLayoutEffect(() => {
    measure()
    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }
    const observer = new ResizeObserver(measure)
    for (const ref of [containerRef, tabsRef, rightContentRef]) {
      if (ref.current instanceof HTMLElement) {
        observer.observe(ref.current)
      }
    }
    return () => observer.disconnect()
    // `collapsed` re-arms the observers when the tabs (re)mount.
  }, [measure, measureKey, collapsed])

  return { collapsed, containerRef, tabsRef, rightContentRef }
}
