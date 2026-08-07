import { useVirtualizer, useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { isMobileWeb } from '@universe/environment'
import { useCallback, useEffect, useRef, useState } from 'react'

const OVERSCAN = isMobileWeb ? 3 : 10

export type TableVirtualizationMode = 'window' | 'container'

function measureScrollMargin(node: HTMLDivElement | null): number {
  if (!node) {
    return 0
  }
  // Document offset via getBoundingClientRect — offsetTop is relative to the nearest positioned
  // ancestor (Tamagui Flex is position:relative), not the document root.
  return node.getBoundingClientRect().top + window.scrollY
}

/**
 * Flat-row virtualizer for TableBody. Two scroll strategies:
 * - `window`: the page scrolls (e.g. Portfolio Activity). Tracks the container's document offset
 *   for `scrollMargin`, re-measuring on `document.body` resize since content above can change
 *   height after mount.
 * - `container`: the table body scrolls inside its own maxHeight container (e.g. hidden tokens).
 *
 * Both `useVirtualizer` and `useWindowVirtualizer` are always called (Rules of Hooks); only the
 * active mode gets a non-zero `count`, the other stays inert.
 */
export function useTableVirtualizer({
  mode,
  count,
  estimateSize,
  forwardedRef,
}: {
  mode: TableVirtualizationMode | undefined
  count: number
  estimateSize: () => number
  forwardedRef: React.Ref<HTMLDivElement>
}): {
  virtualizer: Virtualizer<Window, Element> | Virtualizer<HTMLElement, Element>
  setContainerRef: (node: HTMLDivElement | null) => void
} {
  const containerNodeRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerNodeRef.current = node
      if (mode === 'window') {
        setScrollMargin(measureScrollMargin(node))
      }
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        forwardedRef.current = node
      }
    },
    [mode, forwardedRef],
  )

  useEffect(() => {
    if (mode !== 'window') {
      return undefined
    }
    const resizeObserver = new ResizeObserver(() => setScrollMargin(measureScrollMargin(containerNodeRef.current)))
    resizeObserver.observe(document.body)
    return () => resizeObserver.disconnect()
  }, [mode])

  const containerVirtualizer = useVirtualizer({
    count: mode === 'container' ? count : 0,
    // ScrollSyncPane overwrites refs on TableBodyContainer, so resolve the scroll parent lazily
    // from the body node — the react adapter re-reads this every render.
    getScrollElement: () => containerNodeRef.current?.parentElement ?? null,
    estimateSize,
    overscan: OVERSCAN,
  })

  const windowVirtualizer = useWindowVirtualizer({
    count: mode === 'window' ? count : 0,
    estimateSize,
    overscan: OVERSCAN,
    scrollMargin,
  })

  return {
    virtualizer: mode === 'container' ? containerVirtualizer : windowVirtualizer,
    setContainerRef,
  }
}
