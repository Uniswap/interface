import { flexRender, getCoreRowModel, getExpandedRowModel, RowData, useReactTable } from '@tanstack/react-table'
import { useParentSize } from '@visx/responsive'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { Flex, HeightAnimator, Separator, Text, TouchableArea } from 'ui/src'
import { DoubleChevron } from 'ui/src/components/icons/DoubleChevron'
import { DoubleChevronInverted } from 'ui/src/components/icons/DoubleChevronInverted'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { zIndexes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { useTableExpandedState } from '~/components/Table/hooks/useTableExpandedState'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { usePinnedColumns } from '~/components/Table/PinnedColumns/usePinnedColumns'
import {
  CellContainer,
  HeaderRow,
  HiddenTableScrollContainer,
  TableBodyContainer,
  TableContainer,
  TableHead,
  TableSeparatorRow,
} from '~/components/Table/styled'
import { TableBody } from '~/components/Table/TableBody'
import { TableLoadMoreIndicator } from '~/components/Table/TableLoadMore/TableLoadMoreIndicator'
import { useTableLoadMore } from '~/components/Table/TableLoadMore/useTableLoadMore'
import { TableScrollMask } from '~/components/Table/TableScrollMask'
import { TableSideScrollButtons } from '~/components/Table/TableSideScrollButtons/TableSideScrollButtons'
import { useTableSideScrollButtons } from '~/components/Table/TableSideScrollButtons/useTableSideScrollButtons'
import { TableSizeProvider } from '~/components/Table/TableSizeProvider'
import type { TableProps } from '~/components/Table/types'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

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
  subRowHeight,
  singleExpandedRow = false,
  centerArrows = false,
  headerTestId,
  getSubRows,
  hiddenRows,
  showHiddenRowsLabel,
  hideHiddenRowsLabel,
}: TableProps<T>) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const [areHiddenRowsShown, setAreHiddenRowsShown] = useState(false)
  const toggleHiddenRows = useEvent(() => setAreHiddenRowsShown((prev) => !prev))
  const hasHiddenRows = hiddenRows && hiddenRows.length > 0
  const hiddenLabel = hideHiddenRowsLabel ?? t('table.hideHiddenRows')
  const showLabel = showHiddenRowsLabel ?? t('table.showHiddenRows')

  const { pinnedColumns, hasPinnedColumns } = usePinnedColumns({
    defaultPinnedColumns,
    maxWidth,
    forcePinning,
  })
  const { expanded, onExpandedChange } = useTableExpandedState(singleExpandedRow)
  const tableBodyRef = useRef<HTMLDivElement>(null)

  const isSticky = useMemo(() => !maxHeight, [maxHeight])

  const { parentRef, width, height, top, left } = useParentSize()

  const { loadingMore } = useTableLoadMore({
    tableBodyRef,
    maxHeight,
    loadMore,
    dataLength: data.length,
    loading,
    error,
  })

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
      onExpandedChange,
    }),
  })

  const hiddenTable = useReactTable({
    data: hiddenRows ?? [],
    columns,
    state: {
      columnPinning: { left: pinnedColumns },
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId,
    getSubRows,
  })

  const headerHeight = useAppHeaderHeight()

  const sideScrollButtons = useTableSideScrollButtons({
    tableBodyRef,
    table,
    loading,
    pinnedColumnsLength: pinnedColumns.length,
    maxHeight,
    isSticky,
    centerArrows,
    height,
    headerHeight,
  })

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
            <TableSideScrollButtons {...sideScrollButtons} table={table} v2={v2} isSticky={isSticky} />
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
        {hasPinnedColumns && (!v2 || sideScrollButtons.showRightFadeOverlay) && (
          <TableScrollMask
            zIndex={zIndexes.default}
            borderBottomRightRadius={v2 ? '$rounded12' : '$rounded20'}
            right={v2 ? 0 : 1}
          />
        )}
      </>
      <ScrollSyncPane group={scrollGroup}>
        <TableBodyContainer
          maxHeight={computedBodyMaxHeight}
          v2={v2}
          hasHiddenRows={hasHiddenRows && !loading && !error}
        >
          <TableBody
            loading={loading}
            error={error}
            v2={v2}
            rowWrapper={rowWrapper}
            loadingRowsCount={loadingRowsCount}
            rowHeight={rowHeight}
            compactRowHeight={compactRowHeight}
            subRowHeight={subRowHeight}
            hasPinnedColumns={hasPinnedColumns}
            // @ts-ignore
            table={table}
            ref={tableBodyRef}
          />
        </TableBodyContainer>
      </ScrollSyncPane>
      {hasHiddenRows && !loading && !error && (
        <>
          {/* Separator with expand/collapse control */}
          <TableSeparatorRow
            v2={v2}
            isExpanded={areHiddenRowsShown}
            borderBottomRightRadius={areHiddenRowsShown ? 0 : v2 ? '$rounded12' : '$rounded20'}
            borderBottomLeftRadius={areHiddenRowsShown ? 0 : v2 ? '$rounded12' : '$rounded20'}
          >
            <Separator />
            <TouchableArea
              onPress={toggleHiddenRows}
              aria-expanded={areHiddenRowsShown}
              aria-controls="hidden-rows-section"
            >
              <Flex row gap="$spacing8" alignItems="center">
                <Text variant="body3" color="$neutral2">
                  {areHiddenRowsShown ? hiddenLabel : showLabel}
                </Text>
                {areHiddenRowsShown ? (
                  <DoubleChevron size="$icon.12" color="$neutral3" />
                ) : (
                  <DoubleChevronInverted size="$icon.12" color="$neutral3" />
                )}
              </Flex>
            </TouchableArea>
            <Separator />
          </TableSeparatorRow>

          {/* Animated hidden rows */}
          <HeightAnimator
            open={areHiddenRowsShown}
            animation="200ms"
            id="hidden-rows-section"
            styleProps={{ overflowY: 'hidden', overflowX: 'visible' } as any}
          >
            <ScrollSyncPane group={scrollGroup}>
              <HiddenTableScrollContainer v2={v2}>
                <TableBody
                  table={hiddenTable}
                  v2={v2}
                  rowWrapper={rowWrapper}
                  rowHeight={rowHeight}
                  compactRowHeight={compactRowHeight}
                  subRowHeight={subRowHeight}
                  hasPinnedColumns={hasPinnedColumns}
                  dimmed={true}
                />
              </HiddenTableScrollContainer>
            </ScrollSyncPane>
          </HeightAnimator>
        </>
      )}
      <TableLoadMoreIndicator loadingMore={loadingMore} />
    </TableContainer>
  )

  return (
    <TableSizeProvider value={tableSize}>
      {externalScrollSync ? content : <ScrollSync horizontal>{content}</ScrollSync>}
    </TableSizeProvider>
  )
}
