import { ApolloError } from '@apollo/client'
import {
  Cell,
  CellContext,
  ColumnDef,
  Row,
  RowData,
  Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Loader from 'components/Icons/LoadingSpinner'
import { ErrorModal } from 'components/Table/ErrorBox'
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
import { getCommonPinningStyles } from 'components/Table/utils'
import useDebounce from 'hooks/useDebounce'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import { LinkProps } from 'react-router-dom'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { ThemedText } from 'theme/components'
import { Flex, TouchableArea, useMedia } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { UseSporeColorsReturn, useSporeColors } from 'ui/src/hooks/useSporeColors'
import { INTERFACE_NAV_HEIGHT, zIndexes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const ROW_HEIGHT_DESKTOP = 56
const ROW_HEIGHT_MOBILE_WEB = 48

const TableCell = memo(({ cell, colors }: { cell: Cell<RowData, unknown>; colors: UseSporeColorsReturn }) => {
  return (
    <CellContainer style={getCommonPinningStyles(cell.column, colors)}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </CellContainer>
  )
})

TableCell.displayName = 'TableCell'

const TableRow = ({ row }: { row: Row<RowData> }) => {
  const analyticsContext = useTrace()
  const rowOriginal = row.original as {
    linkState: LinkProps['state']
    testId: string
    analytics?: {
      elementName: ElementNameType
      properties: Record<string, unknown>
    }
  }
  const linkState = rowOriginal.linkState
  const rowTestId = rowOriginal.testId
  const colors = useSporeColors()
  const media = useMedia()
  const rowHeight = useMemo(() => (media.lg ? ROW_HEIGHT_MOBILE_WEB : ROW_HEIGHT_DESKTOP), [media.lg])
  const cells = row
    .getVisibleCells()
    .map((cell: Cell<RowData, any>) => <TableCell key={cell.id} cell={cell} colors={colors} />)

  return (
    <Trace
      logPress
      element={rowOriginal.analytics?.elementName}
      properties={{
        ...rowOriginal.analytics?.properties,
        ...analyticsContext,
      }}
    >
      {'link' in rowOriginal && typeof rowOriginal.link === 'string' ? (
        <TableRowLink to={rowOriginal.link} state={linkState} data-testid={rowTestId}>
          <DataRow height={rowHeight}>{cells}</DataRow>
        </TableRowLink>
      ) : (
        <DataRow height={rowHeight} data-testid={rowTestId}>
          {cells}
        </DataRow>
      )}
    </Trace>
  )
}

function TableBody<Data extends RowData>({
  table,
  loading,
  error,
  innerRef,
}: {
  table: TanstackTable<Data>
  loading?: boolean
  error?: ApolloError | boolean
  innerRef: React.RefObject<HTMLDivElement>
}) {
  const rows = table.getRowModel().rows

  if (loading || error) {
    return (
      <>
        {Array.from({ length: 20 }, (_, rowIndex) => (
          <DataRow key={`skeleton-row-${rowIndex}`}>
            {table.getAllColumns().map((column, columnIndex) => (
              <CellContainer key={`skeleton-row-${rowIndex}-column-${columnIndex}`}>
                {flexRender(column.columnDef.cell, {} as CellContext<Data, any>)}
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
    <Flex ref={innerRef} position="relative">
      {rows.map((row) => (
        <TableRow key={row.id} row={row} />
      ))}
    </Flex>
  )
}

const ScrollButton = ({ onPress, opacity }: { onPress: () => void; opacity?: number }) => (
  <TouchableArea onPress={onPress}>
    <Flex
      boxShadow="0 0 20px 0 rgba(0, 0, 0, 0.1)"
      borderRadius="$roundedFull"
      transform="translateY(-50%)"
      backgroundColor="$surface2"
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      p="$spacing12"
      borderWidth={1}
      borderStyle="solid"
      borderColor="$surface3"
      $platform-web={{ backdropFilter: 'blur(2px)' }}
      opacity={opacity}
      transition="opacity 0.2s ease-in-out"
    >
      <ArrowRight color="$neutral1" size="$icon.12" />
    </Flex>
  </TouchableArea>
)

export function Table<Data extends RowData>({
  columns,
  data,
  loading,
  error,
  loadMore,
  maxWidth,
  maxHeight,
  defaultPinnedColumns = [],
  forcePinning = false,
}: {
  columns: ColumnDef<Data, any>[]
  data: Data[]
  loading?: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  defaultPinnedColumns?: string[]
  forcePinning?: boolean
}) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
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
          if (data?.length === lastLoadedLengthRef.current) {
            canLoadMore.current = false
          } else {
            lastLoadedLengthRef.current = data?.length ?? 0
          }
        },
      })
    }
  }, [data?.length, distanceFromTop, distanceToBottom, error, loadMore, loading, loadingMore])

  const table = useReactTable({
    columns,
    data,
    state: { columnPinning: { left: pinnedColumns } },
    getCoreRowModel: getCoreRowModel(),
  })

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
      const nextShowScrollButton = container.scrollLeft < maxScrollLeft
      if (showScrollButton !== nextShowScrollButton) {
        setShowScrollButton(nextShowScrollButton)
      }
    }

    horizontalScrollHandler()
    container.addEventListener('scroll', horizontalScrollHandler)
    return () => {
      container.removeEventListener('scroll', horizontalScrollHandler)
    }
  }, [loading, showScrollButton])

  const headerHeight = useMemo(() => {
    const header = document.getElementById('AppHeader')
    return header?.clientHeight || INTERFACE_NAV_HEIGHT
  }, [])

  const scrollButtonTop = useMemo(() => {
    if (maxHeight) {
      return maxHeight / 2
    } else if (isSticky) {
      return (window.innerHeight - (headerHeight + 12)) / 2
    }

    return 0
  }, [headerHeight, isSticky, maxHeight])

  const onScrollButtonPress = useCallback(() => {
    const container = tableBodyRef.current?.parentElement
    if (!container) {
      return
    }

    container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' })
  }, [])

  const hasPinnedColumns = useMemo(() => pinnedColumns.length > 0, [pinnedColumns])

  return (
    <ScrollSync horizontal>
      <TableContainer maxWidth={maxWidth} maxHeight={maxHeight} position="relative">
        <TableHead $isSticky={isSticky} $top={headerHeight}>
          {hasPinnedColumns && (
            <>
              <Flex position="absolute" top={scrollButtonTop} right={0} pr="$spacing12" zIndex={zIndexes.default}>
                <ScrollButton onPress={onScrollButtonPress} opacity={showScrollButton ? 1 : 0} />
              </Flex>
              <TableScrollMask
                top={isSticky ? '$spacing12' : 0}
                zIndex={zIndexes.dropdown - 1}
                borderTopRightRadius="$rounded20"
              />
            </>
          )}
          <ScrollSyncPane group="table-sync">
            <HeaderRow dimmed={!!error}>
              {table.getFlatHeaders().map((header) => (
                <CellContainer key={header.id} style={getCommonPinningStyles(header.column, colors)}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </CellContainer>
              ))}
            </HeaderRow>
          </ScrollSyncPane>
        </TableHead>
        {hasPinnedColumns && <TableScrollMask zIndex={zIndexes.default} borderBottomRightRadius="$rounded20" />}
        <ScrollSyncPane group="table-sync">
          <TableBodyContainer maxHeight={maxHeight ? maxHeight - headerHeight : 'unset'}>
            <TableBody loading={loading} error={error} table={table} innerRef={tableBodyRef} />
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
    </ScrollSync>
  )
}
