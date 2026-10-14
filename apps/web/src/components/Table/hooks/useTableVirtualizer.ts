import { observeWindowOffset, useVirtualizer, useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { isMobileWeb } from '@universe/environment'
import { useCallback, useEffect, useRef, useState } from 'react'

const OVERSCAN = isMobileWeb ? 3 : 10

export type TableVirtualizationMode = 'window' | 'container'

// TanStack re-applies its render-time window offset on attach, undoing route scroll resets. The no-op
// also swallows `scrollToIndex`/`scrollToOffset` on window-mode tables, since TanStack routes them through
// the same function with the same arguments. Nothing on web calls them; revisit before adding "scroll to row".
const leaveWindowScrollToPage = (): void => {}

// Modal scroll locks (ScrollLock, useIOSBodyScrollLock) pin the body with position: fixed and a negative top, so
// until the lock releases window.scrollY reads 0 and document offsets are shifted by the locked scroll position.
function isBodyScrollPinned(): boolean {
  return document.body.style.position === 'fixed'
}

// Holds the last real offset while the body is pinned; the unlock's scroll restore reports the true one.
const observeWindowOffsetUnlessPinned: typeof observeWindowOffset = (instance, onOffset) =>
  observeWindowOffset(instance, (offset, isScrolling) => {
    if (!isBodyScrollPinned()) {
      onOffset(offset, isScrolling)
    }
  })

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
    const resizeObserver = new ResizeObserver(() => {
      // Pinning and unpinning both resize the body (the scrollbar comes and goes); the unpin resize re-measures.
      if (isBodyScrollPinned()) {
        return
      }
      setScrollMargin(measureScrollMargin(containerNodeRef.current))
    })
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
    scrollToFn: leaveWindowScrollToPage,
    observeElementOffset: observeWindowOffsetUnlessPinned,
  })

  return {
    virtualizer: mode === 'container' ? containerVirtualizer : windowVirtualizer,
    setContainerRef,
  }
}
