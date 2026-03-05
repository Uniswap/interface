import { ApolloError } from '@apollo/client'
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Row,
  RowData,
  useReactTable,
} from '@tanstack/react-table'
import { useParentSize } from '@visx/responsive'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { AnimatePresence, Flex } from 'ui/src'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { zIndexes } from 'ui/src/theme'
import Loader from '~/components/Icons/LoadingSpinner'
import { ScrollButton, ScrollButtonProps } from '~/components/Table/ScrollButton'
import {
  CellContainer,
  HeaderRow,
  LOAD_MORE_BOTTOM_OFFSET,
  LoadingIndicator,
  LoadingIndicatorContainer,
  SHOW_RETURN_TO_TOP_OFFSET,
  TableBodyContainer,
  TableContainer,
  TableHead,
  TableScrollMask,
} from '~/components/Table/styled'
import { TableBody } from '~/components/Table/TableBody'
import { TableSizeProvider } from '~/components/Table/TableSizeProvider'
import { getCommonPinningStyles } from '~/components/Table/utils'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import useDebounce from '~/hooks/useDebounce'

function calculateScrollButtonTop(params: {
  maxHeight?: number
  isSticky: boolean
  centerArrows: boolean
  height: number
  headerHeight: number
}): number {
  const { maxHeight, isSticky, centerArrows, height, headerHeight } = params

  // When centerArrows is true, center based on table height
  if (centerArrows && height > 0) {
    return height / 2
  }

  // When maxHeight is set but centerArrows is false, still use table height
  // (container-based positioning)
  if (maxHeight) {
    return height / 2
  }

  // When sticky and centerArrows is false, use window-based calculation
  if (isSticky) {
    return (window.innerHeight - (headerHeight + 12)) / 2
  }

  return 0
}

export function Table<T extends RowData>({
  columns,
  data,
  loading,
  error,
  loadMore,
  maxWidth,
  maxHeight,
  defaultPinnedColumns = [],
  forcePinning = false,
  v2 = true,
  hideHeader = false,
  externalScrollSync = false,
  scrollGroup = 'table-sync',
  getRowId,
  rowWrapper,
  loadingRowsCount = 20,
  rowHeight,
  compactRowHeight,
  centerArrows = false,
  headerTestId,
  getSubRows,
}: {
  columns: ColumnDef<T, any>[]
  data: T[]
  loading?: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  defaultPinnedColumns?: string[]
  forcePinning?: boolean
  v2: boolean
  hideHeader?: boolean
  externalScrollSync?: boolean
  scrollGroup?: string
  getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  loadingRowsCount?: number
  rowHeight?: number
  compactRowHeight?: number
  centerArrows?: boolean
  headerTestId?: string
  getSubRows?: (row: T) => T[] | undefined
}) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [showScrollLeftButton, setShowScrollLeftButton] = useState(false)
  const [showRightFadeOverlay, setShowRightFadeOverlay] = useState(false)
  const colors = useSporeColors()
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const [scrollPosition, setScrollPosition] = useState<{
    distanceFromTop: number
    distanceToBottom: number
  }>({
    distanceFromTop: 0,
    distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
  })
  const { distanceFromTop, distanceToBottom } = useDebounce(scrollPosition, 125)
  const tableBodyRef = useRef<HTMLDivElement>(null)
  const lastLoadedLengthRef = useRef(0)
  const canLoadMore = useRef(true)
  // Tracks the intended scroll destination during smooth-scroll animations so
  // rapid arrow-button taps advance column-by-column instead of re-targeting
  // the same position while the previous animation is still in flight.
  const targetScrollLeftRef = useRef<number | null>(null)
  const isSticky = useMemo(() => !maxHeight, [maxHeight])

  const { parentRef, width, height, top, left } = useParentSize()

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to run it also when loadMore, loadingMore are changed
  useEffect(() => {
    // Use parentElement because the actual scrolling container is the parent wrapper,
    // not the table body div itself (which is a child of the scrollable container)
    const scrollableElement = maxHeight ? tableBodyRef.current?.parentElement : window
    if (!scrollableElement) {
      return undefined
    }
    const updateScrollPosition = () => {
      if (scrollableElement instanceof HTMLDivElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement
        setScrollPosition({
          distanceFromTop: scrollTop,
          distanceToBottom: scrollHeight - scrollTop - clientHeight,
        })
      } else if (scrollableElement === window) {
        setScrollPosition({
          distanceFromTop: scrollableElement.scrollY,
          distanceToBottom: document.body.scrollHeight - scrollableElement.scrollY - scrollableElement.innerHeight,
        })
      }
    }
    scrollableElement.addEventListener('scroll', updateScrollPosition)
    return () => scrollableElement.removeEventListener('scroll', updateScrollPosition)
  }, [loadMore, maxHeight, loadingMore])

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to run it also when distanceFromTop, loading are changed
  useEffect(() => {
    const scrollableElement = maxHeight ? tableBodyRef.current?.parentElement : window
    const shouldLoadMoreFromScroll = distanceToBottom < LOAD_MORE_BOTTOM_OFFSET
    let shouldLoadMoreFromViewportHeight = false

    if (!shouldLoadMoreFromScroll) {
      if (!maxHeight && scrollableElement === window) {
        const contentHeight = document.body.scrollHeight
        const viewportHeight = window.innerHeight
        shouldLoadMoreFromViewportHeight = contentHeight <= viewportHeight
      } else if (scrollableElement instanceof HTMLDivElement) {
        const { scrollHeight, clientHeight } = scrollableElement
        shouldLoadMoreFromViewportHeight = scrollHeight <= clientHeight
      }
    }

    if (
      (shouldLoadMoreFromScroll || shouldLoadMoreFromViewportHeight) &&
      !loadingMore &&
      loadMore &&
      canLoadMore.current &&
      !error &&
      !loading
    ) {
      setLoadingMore(true)
      // Manually update scroll position to prevent re-triggering
      setScrollPosition({
        distanceFromTop: SHOW_RETURN_TO_TOP_OFFSET,
        distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
      })
      loadMore({
        onComplete: () => {
          setLoadingMore(false)
          if (data.length === lastLoadedLengthRef.current) {
            canLoadMore.current = false
          } else {
            lastLoadedLengthRef.current = data.length
          }
        },
      })
    }
  }, [data.length, distanceFromTop, distanceToBottom, error, loadMore, loading, loadingMore, maxHeight, tableBodyRef])

  const table = useReactTable({
    columns,
    data,
    state: {
      columnPinning: { left: pinnedColumns },
      ...(getSubRows && { expanded }),
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    ...(getSubRows && {
      getSubRows,
      getExpandedRowModel: getExpandedRowModel(),
      onExpandedChange: setExpanded,
    }),
  })
  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to run it also when table is changed
  useEffect(() => {
    const resizeHandler = () => {
      if (!defaultPinnedColumns.length) {
        return
      }

      if ((maxWidth && window.innerWidth < maxWidth) || forcePinning) {
        setPinnedColumns(defaultPinnedColumns)
      } else {
        setPinnedColumns([])
      }
    }
    resizeHandler()
    window.addEventListener('resize', resizeHandler)
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [maxWidth, defaultPinnedColumns, forcePinning, table])

  const SCROLL_EDGE_TOLERANCE_PX = 1

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
      setShowRightFadeOverlay(pinnedColumns.length > 0 && !isFullWidth && !isScrolledToRight)
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
  }, [loading, pinnedColumns.length])

  const headerHeight = useAppHeaderHeight()

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
    (direction: ScrollButtonProps['direction']) => () => {
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
    [table],
  )
  const hasPinnedColumns = useMemo(() => pinnedColumns.length > 0, [pinnedColumns])

  const tableSize = useMemo(() => ({ width, height, top, left }), [width, height, top, left])
  const computedBodyMaxHeight = useMemo(
    () => (maxHeight ? (hideHeader ? maxHeight : maxHeight - headerHeight) : 'unset'),
    [maxHeight, hideHeader, headerHeight],
  )

  const content = (
    <TableContainer maxWidth={maxWidth} maxHeight={maxHeight} position="relative" ref={parentRef}>
      <>
        <TableHead $isSticky={isSticky} $top={headerHeight} mb={v2 && !hasPinnedColumns ? '$spacing2' : undefined}>
          {hasPinnedColumns && (
            <>
              <AnimatePresence>
                {showScrollLeftButton && (
                  <Flex
                    position="absolute"
                    top={scrollButtonTop}
                    left={table.getLeftTotalSize()}
                    pl="$spacing12"
                    zIndex={zIndexes.mask}
                    animateEnter="fadeIn"
                    animateExit="fadeOut"
                    animation="200ms"
                  >
                    <ScrollButton onPress={onScrollButtonPress('left')} direction="left" />
                  </Flex>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showScrollRightButton && (
                  <Flex
                    position="absolute"
                    top={scrollButtonTop}
                    right={0}
                    pr="$spacing12"
                    zIndex={zIndexes.mask}
                    animateEnter="fadeIn"
                    animateExit="fadeOut"
                    animation="200ms"
                  >
                    <ScrollButton onPress={onScrollButtonPress('right')} direction="right" />
                  </Flex>
                )}
              </AnimatePresence>
              {(!v2 || showRightFadeOverlay) && (
                <TableScrollMask
                  top={isSticky ? '$spacing12' : 0}
                  zIndex={zIndexes.dropdown - 1}
                  right={v2 ? 0 : 1}
                  borderTopRightRadius={v2 ? '$rounded12' : '$rounded20'}
                />
              )}
            </>
          )}

          {!hideHeader && (
            <ScrollSyncPane group={scrollGroup}>
              <HeaderRow data-testid={headerTestId} dimmed={!!error} v2={v2}>
                {table.getFlatHeaders().map((header) => (
                  <CellContainer
                    key={header.id}
                    style={getCommonPinningStyles({ column: header.column, colors, v2, isHeader: true })}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </CellContainer>
                ))}
              </HeaderRow>
            </ScrollSyncPane>
          )}
        </TableHead>
        {hasPinnedColumns && (!v2 || showRightFadeOverlay) && (
          <TableScrollMask
            zIndex={zIndexes.default}
            borderBottomRightRadius={v2 ? '$rounded12' : '$rounded20'}
            right={v2 ? 0 : 1}
          />
        )}
      </>
      <ScrollSyncPane group={scrollGroup}>
        <TableBodyContainer maxHeight={computedBodyMaxHeight} v2={v2}>
          <TableBody
            loading={loading}
            error={error}
            v2={v2}
            rowWrapper={rowWrapper}
            loadingRowsCount={loadingRowsCount}
            rowHeight={rowHeight}
            compactRowHeight={compactRowHeight}
            hasPinnedColumns={hasPinnedColumns}
            // @ts-ignore
            table={table}
            ref={tableBodyRef}
          />
        </TableBodyContainer>
      </ScrollSyncPane>
      {loadingMore && (
        <LoadingIndicatorContainer>
          <LoadingIndicator>
            <Loader />
            <Trans i18nKey="common.loading" />
          </LoadingIndicator>
        </LoadingIndicatorContainer>
      )}
    </TableContainer>
  )

  return (
    <TableSizeProvider value={tableSize}>
      {externalScrollSync ? content : <ScrollSync horizontal>{content}</ScrollSync>}
    </TableSizeProvider>
  )
}
