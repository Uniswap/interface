import { ApolloError } from '@apollo/client'
import { ColumnDef, flexRender, getCoreRowModel, Row, RowData, useReactTable } from '@tanstack/react-table'
import { useParentSize } from '@visx/responsive'
import Loader from 'components/Icons/LoadingSpinner'
import { ScrollButton, ScrollButtonProps } from 'components/Table/ScrollButton'
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
} from 'components/Table/styled'
import { TableBody } from 'components/Table/TableBody'
import { TableSizeProvider } from 'components/Table/TableSizeProvider'
import { getCommonPinningStyles } from 'components/Table/utils'
import useDebounce from 'hooks/useDebounce'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { Flex } from 'ui/src'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'

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
}) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [showScrollLeftButton, setShowScrollLeftButton] = useState(false)
  const [showRightFadeOverlay, setShowRightFadeOverlay] = useState(false)
  const colors = useSporeColors()
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([])

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
    state: { columnPinning: { left: pinnedColumns } },
    getCoreRowModel: getCoreRowModel(),
    getRowId,
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

  useEffect(() => {
    const container = tableBodyRef.current?.parentElement
    if (!container || loading) {
      return undefined
    }

    const horizontalScrollHandler = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth
      const nextShowScrollRightButton = container.scrollLeft < maxScrollLeft
      if (showScrollRightButton !== nextShowScrollRightButton) {
        setShowScrollRightButton(nextShowScrollRightButton)
      }
      const nextShowScrollLeftButton = container.scrollLeft > 0
      if (showScrollLeftButton !== nextShowScrollLeftButton) {
        setShowScrollLeftButton(nextShowScrollLeftButton)
      }
      // Hide overlay when table is full width or scrolled all the way to the right
      const isFullWidth = maxScrollLeft <= 0
      const isScrolledToRight = container.scrollLeft >= maxScrollLeft
      const nextShowRightFadeOverlay = pinnedColumns.length > 0 && !isFullWidth && !isScrolledToRight
      if (showRightFadeOverlay !== nextShowRightFadeOverlay) {
        setShowRightFadeOverlay(nextShowRightFadeOverlay)
      }
    }

    horizontalScrollHandler()
    container.addEventListener('scroll', horizontalScrollHandler)
    return () => {
      container.removeEventListener('scroll', horizontalScrollHandler)
    }
  }, [loading, showScrollLeftButton, showScrollRightButton, showRightFadeOverlay, pinnedColumns.length])

  const headerHeight = useMemo(() => {
    const header = document.getElementById('AppHeader')
    return header?.clientHeight || INTERFACE_NAV_HEIGHT
  }, [])

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

      if (direction === 'left') {
        cumulativeWidths.reverse()
      }

      const nextScrollLeft = cumulativeWidths.find((width) => {
        if (direction === 'left') {
          return width < container.scrollLeft
        }
        return width > container.scrollLeft
      })

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
        <TableHead $isSticky={isSticky} $top={headerHeight}>
          {hasPinnedColumns && (
            <>
              <Flex
                position="absolute"
                top={scrollButtonTop}
                left={table.getLeftTotalSize()}
                pl="$spacing12"
                zIndex={zIndexes.mask}
              >
                <ScrollButton
                  onPress={onScrollButtonPress('left')}
                  opacity={showScrollLeftButton ? 1 : 0}
                  direction="left"
                />
              </Flex>
              <Flex position="absolute" top={scrollButtonTop} right={0} pr="$spacing12" zIndex={zIndexes.mask}>
                <ScrollButton
                  onPress={onScrollButtonPress('right')}
                  opacity={showScrollRightButton ? 1 : 0}
                  direction="right"
                />
              </Flex>
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
              <HeaderRow dimmed={!!error} v2={v2}>
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
