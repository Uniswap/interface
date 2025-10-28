import { ApolloError } from '@apollo/client'
import {
  Cell,
  CellContext,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  Row,
  RowData,
  Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table'
import { useParentSize } from '@visx/responsive'
import Loader from 'components/Icons/LoadingSpinner'
import { ErrorModal } from 'components/Table/ErrorBox'
import { ScrollButton, ScrollButtonProps } from 'components/Table/ScrollButton'
import {
  CellContainer,
  DataRow,
  HeaderRow,
  LOAD_MORE_BOTTOM_OFFSET,
  LoadingIndicator,
  LoadingIndicatorContainer,
  NoDataFoundTableRow,
  SHOW_RETURN_TO_TOP_OFFSET,
  TableBodyContainer,
  TableContainer,
  TableHead,
  TableRowLink,
  TableScrollMask,
} from 'components/Table/styled'
import { TableSizeProvider, useTableSize } from 'components/Table/TableSizeProvider'
import { getCommonPinningStyles } from 'components/Table/utils'
import useDebounce from 'hooks/useDebounce'
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { LinkProps } from 'react-router'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { UseSporeColorsReturn, useSporeColors } from 'ui/src/hooks/useSporeColors'
import { breakpoints, INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const ROW_HEIGHT_DESKTOP = 56
const ROW_HEIGHT_MOBILE_WEB = 48

interface TableCellProps<T extends RowData> {
  cell: Cell<T, unknown>
  colors: UseSporeColorsReturn
}

function TableCellComponent<T extends RowData>({ cell, colors }: TableCellProps<T>): JSX.Element {
  return (
    <CellContainer style={getCommonPinningStyles(cell.column, colors)}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </CellContainer>
  )
}

const TableCell = memo(TableCellComponent) as typeof TableCellComponent

interface TableRowProps<T extends RowData> {
  row: Row<T>
  v2: boolean
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
}

function TableRowComponent<T extends RowData>({ row, v2 = true, rowWrapper }: TableRowProps<T>): JSX.Element {
  const analyticsContext = useTrace()
  const rowOriginal = row.original as {
    linkState: LinkProps['state']
    testId: string
    analytics?: {
      elementName: ElementName
      properties: Record<string, unknown>
    }
  }
  const linkState = rowOriginal.linkState
  const rowTestId = rowOriginal.testId
  const colors = useSporeColors()
  const { width: tableWidth } = useTableSize()
  const rowHeight = useMemo(
    () => (tableWidth <= breakpoints.lg ? ROW_HEIGHT_MOBILE_WEB : ROW_HEIGHT_DESKTOP),
    [tableWidth],
  )
  const cells = row
    .getVisibleCells()
    .map((cell: Cell<T, unknown>) => <TableCell<T> key={cell.id} cell={cell} colors={colors} />)

  const rowContent = (
    <Trace
      logPress
      element={rowOriginal.analytics?.elementName}
      properties={{
        ...rowOriginal.analytics?.properties,
        ...analyticsContext,
      }}
    >
      <Flex group>
        {'link' in rowOriginal && typeof rowOriginal.link === 'string' ? (
          <TableRowLink to={rowOriginal.link} state={linkState} data-testid={rowTestId}>
            <DataRow height={rowHeight} v2={v2}>
              {cells}
            </DataRow>
          </TableRowLink>
        ) : (
          <DataRow height={rowHeight} data-testid={rowTestId} v2={v2}>
            {cells}
          </DataRow>
        )}
      </Flex>
    </Trace>
  )
  return rowWrapper ? rowWrapper(row, rowContent) : rowContent
}

const TableRow = memo(TableRowComponent) as typeof TableRowComponent

type TableBodyProps<T extends RowData = unknown> = {
  table: TanstackTable<T>
  loading?: boolean
  error?: ApolloError | boolean
  v2: boolean
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
}

function TableBodyInner<T extends RowData>(
  { table, loading, error, v2 = true, rowWrapper }: TableBodyProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const rows = table.getRowModel().rows
  const { width: tableWidth } = useTableSize()
  const skeletonRowHeight = useMemo(
    () => (tableWidth <= breakpoints.lg ? ROW_HEIGHT_MOBILE_WEB : ROW_HEIGHT_DESKTOP),
    [tableWidth],
  )

  if (loading || error) {
    return (
      <>
        {Array.from({ length: 20 }, (_, rowIndex) => (
          <DataRow key={`skeleton-row-${rowIndex}`} height={skeletonRowHeight} v2={v2}>
            {table.getAllColumns().map((column, columnIndex) => (
              <CellContainer key={`skeleton-row-${rowIndex}-column-${columnIndex}`}>
                {flexRender(column.columnDef.cell, {} as CellContext<T, any>)}
              </CellContainer>
            ))}
          </DataRow>
        ))}
        {error && (
          <ErrorModal
            header={<Trans i18nKey="common.errorLoadingData.error" />}
            subtitle={<Trans i18nKey="error.dataUnavailable" />}
          />
        )}
      </>
    )
  }

  if (!rows.length) {
    return (
      <NoDataFoundTableRow py="$spacing20">
        <ThemedText.BodySecondary>
          <Trans i18nKey="error.noData" />
        </ThemedText.BodySecondary>
      </NoDataFoundTableRow>
    )
  }

  return (
    <Flex ref={ref} position="relative">
      {rows.map((row) => (
        <TableRow<T> key={row.id} row={row} v2={v2} rowWrapper={rowWrapper} />
      ))}
    </Flex>
  )
}

const TableBody = forwardRef(TableBodyInner) as unknown as <T extends RowData>(
  p: TableBodyProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => JSX.Element

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
}) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [showScrollLeftButton, setShowScrollLeftButton] = useState(false)
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
    const scrollableElement = maxHeight ? tableBodyRef.current : window
    if (scrollableElement === null) {
      return undefined
    }
    const updateScrollPosition = () => {
      if (scrollableElement instanceof HTMLDivElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement
        setScrollPosition({
          distanceFromTop: scrollTop,
          distanceToBottom: scrollHeight - scrollTop - clientHeight,
        })
      } else {
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
    if (distanceToBottom < LOAD_MORE_BOTTOM_OFFSET && !loadingMore && loadMore && canLoadMore.current && !error) {
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
  }, [data.length, distanceFromTop, distanceToBottom, error, loadMore, loading, loadingMore])

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
    }

    horizontalScrollHandler()
    container.addEventListener('scroll', horizontalScrollHandler)
    return () => {
      container.removeEventListener('scroll', horizontalScrollHandler)
    }
  }, [loading, showScrollLeftButton, showScrollRightButton])

  const headerHeight = useMemo(() => {
    const header = document.getElementById('AppHeader')
    return header?.clientHeight || INTERFACE_NAV_HEIGHT
  }, [])

  const scrollButtonTop = useMemo(() => {
    if (maxHeight) {
      return height / 2
    } else if (isSticky) {
      return (window.innerHeight - (headerHeight + 12)) / 2
    }

    return 0
  }, [headerHeight, height, isSticky, maxHeight])

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
      {!hideHeader && (
        <>
          <TableHead $isSticky={isSticky} $top={headerHeight}>
            {hasPinnedColumns && (
              <>
                <Flex
                  position="absolute"
                  top={scrollButtonTop}
                  left={table.getLeftTotalSize()}
                  pl="$spacing12"
                  zIndex={zIndexes.default}
                >
                  <ScrollButton
                    onPress={onScrollButtonPress('left')}
                    opacity={showScrollLeftButton ? 1 : 0}
                    direction="left"
                  />
                </Flex>
                <Flex position="absolute" top={scrollButtonTop} right={0} pr="$spacing12" zIndex={zIndexes.default}>
                  <ScrollButton
                    onPress={onScrollButtonPress('right')}
                    opacity={showScrollRightButton ? 1 : 0}
                    direction="right"
                  />
                </Flex>
                <TableScrollMask
                  top={isSticky ? '$spacing12' : 0}
                  zIndex={zIndexes.dropdown - 1}
                  borderTopRightRadius="$rounded20"
                />
              </>
            )}
            <ScrollSyncPane group={scrollGroup}>
              <HeaderRow dimmed={!!error} v2={v2}>
                {table.getFlatHeaders().map((header) => (
                  <CellContainer key={header.id} style={getCommonPinningStyles(header.column, colors)}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </CellContainer>
                ))}
              </HeaderRow>
            </ScrollSyncPane>
          </TableHead>
          {hasPinnedColumns && <TableScrollMask zIndex={zIndexes.default} borderBottomRightRadius="$rounded20" />}
        </>
      )}
      <ScrollSyncPane group={scrollGroup}>
        <TableBodyContainer maxHeight={computedBodyMaxHeight} v2={v2}>
          <TableBody
            loading={loading}
            error={error}
            v2={v2}
            rowWrapper={rowWrapper}
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
