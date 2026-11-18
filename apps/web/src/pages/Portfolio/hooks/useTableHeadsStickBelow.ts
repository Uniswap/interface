import { type RefObject, useEffect } from 'react'
import { TABLE_STICKY_TOP_OFFSET_VAR } from '~/components/Table/constants'

/**
 * Pins the sticky table heads inside `containerRef` below `headerRef`, a sticky element that shares
 * their `top` and would otherwise cover them.
 */
export function useTableHeadsStickBelow({
  headerRef,
  containerRef,
  enabled,
}: {
  headerRef: RefObject<HTMLElement | null>
  containerRef: RefObject<HTMLElement | null>
  enabled: boolean
}): void {
  useEffect(() => {
    const header = headerRef.current
    const container = containerRef.current
    if (!enabled || !header || !container) {
      return undefined
    }
    // Written to the DOM rather than state: the header animates between heights on scroll, and
    // re-rendering every table per frame would stall it.
    const observer = new ResizeObserver(() => {
      container.style.setProperty(TABLE_STICKY_TOP_OFFSET_VAR, `${header.offsetHeight}px`)
    })
    observer.observe(header)
    return () => {
      observer.disconnect()
      container.style.removeProperty(TABLE_STICKY_TOP_OFFSET_VAR)
    }
  }, [headerRef, containerRef, enabled])
}
