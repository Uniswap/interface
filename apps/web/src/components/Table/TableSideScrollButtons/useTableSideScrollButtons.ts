import { RowData, Table as TanstackTable } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TableScrollButtonProps } from '~/components/Table/TableSideScrollButtons/TableScrollButton'
import { calculateScrollButtonTop, SCROLL_EDGE_TOLERANCE_PX } from '~/components/Table/TableSideScrollButtons/utils'

export function useTableSideScrollButtons<T extends RowData>(params: {
  tableBodyRef: React.RefObject<HTMLDivElement | null>
  table: TanstackTable<T>
  loading: boolean | undefined
  pinnedColumnsLength: number
  maxHeight: number | undefined
  isSticky: boolean
  centerArrows: boolean
  height: number
  headerHeight: number
}) {
  const { tableBodyRef, table, loading, pinnedColumnsLength, maxHeight, isSticky, centerArrows, height, headerHeight } =
    params

  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [showScrollLeftButton, setShowScrollLeftButton] = useState(false)
  const [showRightFadeOverlay, setShowRightFadeOverlay] = useState(false)
  // Tracks the intended scroll destination during smooth-scroll animations so
  // rapid arrow-button taps advance column-by-column instead of re-targeting
  // the same position while the previous animation is still in flight.
  const targetScrollLeftRef = useRef<number | null>(null)

  useEffect(() => {
    const container = tableBodyRef.current?.parentElement
    if (!container || loading) {
      return undefined
    }

    const updateScrollButtonVisibility = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      // Tolerance accounts for sub-pixel rounding from smooth scroll animations
      setShowScrollRightButton(container.scrollLeft < maxScrollLeft - SCROLL_EDGE_TOLERANCE_PX)
      setShowScrollLeftButton(container.scrollLeft > SCROLL_EDGE_TOLERANCE_PX)

      // Clear the optimistic scroll target once the animation reaches its destination
      if (
        targetScrollLeftRef.current !== null &&
        Math.abs(container.scrollLeft - targetScrollLeftRef.current) < SCROLL_EDGE_TOLERANCE_PX
      ) {
        targetScrollLeftRef.current = null
      }

      // Hide overlay when table is full width or scrolled all the way to the right
      const isFullWidth = maxScrollLeft <= 0
      const isScrolledToRight = container.scrollLeft >= maxScrollLeft
      setShowRightFadeOverlay(pinnedColumnsLength > 0 && !isFullWidth && !isScrolledToRight)
    }

    updateScrollButtonVisibility()
    container.addEventListener('scroll', updateScrollButtonVisibility)

    // Listen to resize events in case the container size changes
    const resizeObserver = new ResizeObserver(updateScrollButtonVisibility)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateScrollButtonVisibility)
      resizeObserver.disconnect()
    }
  }, [loading, pinnedColumnsLength, tableBodyRef])

  const scrollButtonTop = useMemo(() => {
    return calculateScrollButtonTop({
      maxHeight,
      isSticky,
      centerArrows,
      height,
      headerHeight,
    })
  }, [headerHeight, height, isSticky, maxHeight, centerArrows])

  const onScrollButtonPress = useCallback(
    (direction: TableScrollButtonProps['direction']) => () => {
      const container = tableBodyRef.current?.parentElement
      if (!container) {
        return
      }

      const numPinnedVisibleColumns = table.getLeftVisibleLeafColumns().length
      const regularColumns = table.getAllColumns().slice(numPinnedVisibleColumns)
      const widths = regularColumns.map((column) => column.getSize())
      const cumulativeWidths = widths.reduce(
        (acc, current) => {
          const lastSum = acc.length > 0 ? acc[acc.length - 1] : 0
          return [...acc, lastSum + current]
        },
        [0] as number[],
      )

      // Use the optimistic target (if mid-animation) so rapid taps advance
      // to successive column boundaries instead of re-targeting the same one
      const currentPosition = targetScrollLeftRef.current ?? container.scrollLeft

      if (direction === 'left') {
        cumulativeWidths.reverse()
      }

      // Find the next column boundary beyond the current (or optimistic) position
      const nextScrollLeft = cumulativeWidths.find((width) => {
        if (direction === 'left') {
          return width < currentPosition
        }
        return width > currentPosition
      })

      // No column boundary found — this happens when column.getSize() totals
      // don't match actual rendered widths (e.g. flexGrow expands cells).
      // Fall back to scrolling to the absolute edge if we're not there yet.
      if (nextScrollLeft === undefined) {
        const maxScrollLeft = container.scrollWidth - container.clientWidth
        if (direction === 'right' && container.scrollLeft < maxScrollLeft - SCROLL_EDGE_TOLERANCE_PX) {
          targetScrollLeftRef.current = maxScrollLeft
          container.scrollTo({ left: maxScrollLeft, behavior: 'smooth' })
        } else if (direction === 'left' && container.scrollLeft > SCROLL_EDGE_TOLERANCE_PX) {
          targetScrollLeftRef.current = 0
          container.scrollTo({ left: 0, behavior: 'smooth' })
        }
        return
      }

      // Clamp to valid scroll range so the ref matches the actual scroll
      // endpoint (the browser clamps scrollTo internally, but the ref must agree
      // for the scroll-event handler to clear it)
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      targetScrollLeftRef.current = Math.min(Math.max(nextScrollLeft, 0), maxScrollLeft)
      container.scrollTo({ left: nextScrollLeft, behavior: 'smooth' })
    },
    [table, tableBodyRef],
  )

  return {
    showScrollLeftButton,
    showScrollRightButton,
    showRightFadeOverlay,
    scrollButtonTop,
    onScrollButtonPress,
  }
}
