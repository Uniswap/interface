import { flexRender, getCoreRowModel, getExpandedRowModel, RowData, useReactTable } from '@tanstack/react-table'
import useParentSize from '@visx/responsive/lib/hooks/useParentSize'
import { PropsWithChildren, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { FlexProps, HeightAnimator, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { Flex, styled } from 'ui/src/index'
import { zIndexes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { useTableBottomFade } from '~/components/Table/hooks/useTableBottomFade'
import { useTableExpandedState } from '~/components/Table/hooks/useTableExpandedState'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { TablePinnedColumnOverlay } from '~/components/Table/PinnedColumns/TablePinnedColumnOverlay'
import { usePinnedColumns } from '~/components/Table/PinnedColumns/usePinnedColumns'
import { CellContainer, TableRowBase } from '~/components/Table/styled'
import { TableBody } from '~/components/Table/TableBody'
import { TableLoadMoreIndicator } from '~/components/Table/TableLoadMore/TableLoadMoreIndicator'
import { useTableLoadMore } from '~/components/Table/TableLoadMore/useTableLoadMore'
import { TableBottomFade, TableScrollMask } from '~/components/Table/TableScrollMask'
import { TableSideScrollButtons } from '~/components/Table/TableSideScrollButtons/TableSideScrollButtons'
import { useTableSideScrollButtons } from '~/components/Table/TableSideScrollButtons/useTableSideScrollButtons'
import { TableSizeProvider } from '~/components/Table/TableSizeProvider'
import { TableProps } from '~/components/Table/types'
import { computeBodyMaxHeight } from '~/components/Table/utils/computeBodyMaxHeight'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

const TableContainer = styled(Flex, {
  centered: true,
  m: '0 auto 24px auto',
  className: 'scrollbar-hidden',
})

const TableBodyContainer = styled(Flex, {
  width: '100%',
  position: 'relative',
  className: 'scrollbar-hidden',
  justifyContent: 'flex-start',
  borderStyle: 'solid',
  '$platform-web': {
    overscrollBehaviorX: 'none',
    overflowX: 'auto',
    overflowY: 'auto',
  },
  variants: {
    v2: {
      true: {
        borderBottomRightRadius: '$rounded12',
        borderBottomLeftRadius: '$rounded12',
        borderWidth: 0,
      },
      false: {
        borderBottomRightRadius: '$rounded20',
        borderBottomLeftRadius: '$rounded20',
        borderColor: '$surface3',
        borderWidth: 1,
        borderTopWidth: '$none',
      },
    },
    hasHiddenRows: {
      true: {
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomWidth: 0,
      },
    },
  } as const,
})

const HiddenTableScrollContainer = styled(Flex, {
  width: '100%',
  position: 'relative',
  className: 'scrollbar-hidden',
  justifyContent: 'flex-start',
  borderStyle: 'solid',
  '$platform-web': {
    overscrollBehaviorX: 'none',
    overflowX: 'auto',
    overflowY: 'visible', // Critical: allows sticky to work
  },
  variants: {
    v2: {
      true: {
        borderBottomRightRadius: '$rounded12',
        borderBottomLeftRadius: '$rounded12',
        borderWidth: 0,
      },
      false: {
        borderBottomRightRadius: '$rounded20',
        borderBottomLeftRadius: '$rounded20',
        borderColor: '$surface3',
        borderWidth: 1,
        borderTopWidth: 0,
      },
    },
  },
})

const TableSeparatorRow = styled(Flex, {
  centered: true,
  row: true,
  gap: '$spacing12',
  py: '$spacing8',
  px: '$spacing16',
  borderStyle: 'solid',
  width: '100%',
  variants: {
    v2: {
      true: {
        borderWidth: 0,
      },
      false: {
        borderColor: '$surface3',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 0,
        borderBottomWidth: 0,
      },
    },
    showBottomBorder: {
      true: {
        borderBottomWidth: 1,
      },
    },
  } as const,
})

const TableHead = (
  props: PropsWithChildren<{
    $isSticky: boolean
    $top: number
    mb?: FlexProps['mb']
  }>,
): JSX.Element => (
  <Flex
    width="100%"
    zIndex={zIndexes.dropdown - 2}
    top={props.$isSticky ? props.$top : 'unset'}
    justifyContent="flex-end"
    backgroundColor="$surface1"
    className="scrollbar-hidden"
    $platform-web={props.$isSticky ? { position: 'sticky' } : {}}
    mb={props.mb}
  >
    {props.$isSticky && <Flex height={12} />}
    {props.children}
  </Flex>
)

const HeaderRow = styled(TableRowBase, {
  width: 'unset',
  scrollbarWidth: 'none',
  className: 'scrollbar-hidden',
  transition: 'unset',

  '$platform-web': {
    overscrollBehavior: 'none',
    overflow: 'auto',
  },
  variants: {
    dimmed: {
      true: {
        opacity: 0.4,
      },
    },
    v2: {
      true: {
        backgroundColor: '$surface2',
        borderRadius: '$rounded12',
      },
      false: {
        backgroundColor: '$surface1Hovered',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '$surface3',
        borderTopRightRadius: '$rounded20',
        borderTopLeftRadius: '$rounded20',
        borderBottomRightRadius: 'unset',
        borderBottomLeftRadius: 'unset',
      },
    },
  } as const,
})

// oxlint-disable-next-line complexity
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
  topLevelRowWrapper,
  subRowsWrapper,
  renderUnifiedExpandableRow,
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
  showScrollbar,
  virtualized = false,
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
  const showBottomFade = useTableBottomFade(tableBodyRef, !!maxHeight)

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

  const rowContentMinWidthPx = useMemo(
    () => table.getAllLeafColumns().reduce((sum, column) => sum + column.getSize(), 0),
    [table],
  )

  const tableSize = useMemo(
    () => ({ width, height, top, left, rowContentMinWidthPx }),
    [width, height, top, left, rowContentMinWidthPx],
  )
  const computedBodyMaxHeight = useMemo(() => {
    if (!maxHeight) {
      return 'unset' as const
    }
    const bodyHeight = hideHeader ? maxHeight : maxHeight - headerHeight
    const itemHeight = rowHeight ?? compactRowHeight

    return computeBodyMaxHeight({ bodyHeight, itemHeight, hasPinnedColumns })
  }, [maxHeight, hideHeader, headerHeight, rowHeight, compactRowHeight, hasPinnedColumns])

  const extendedPinnedColumnDivider = hasPinnedColumns && v2
  const pinnedColumnOverlayLeftPx = table.getLeftTotalSize()

  const content = (
    <TableContainer maxWidth={maxWidth} maxHeight={maxHeight} position="relative" ref={parentRef}>
      {extendedPinnedColumnDivider ? (
        <TablePinnedColumnOverlay leftPx={pinnedColumnOverlayLeftPx} color={colors.surface3.val} />
      ) : null}
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
                    style={getCommonPinningStyles({
                      column: header.column,
                      colors,
                      v2,
                      isHeader: true,
                      hidePinnedColumnBorder: extendedPinnedColumnDivider,
                    })}
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
          {...(showScrollbar && { scrollbarWidth: 'thin' as const })}
        >
          <TableBody
            loading={loading}
            error={error}
            v2={v2}
            rowWrapper={rowWrapper}
            topLevelRowWrapper={topLevelRowWrapper}
            subRowsWrapper={subRowsWrapper}
            renderUnifiedExpandableRow={renderUnifiedExpandableRow}
            loadingRowsCount={loadingRowsCount}
            rowHeight={rowHeight}
            compactRowHeight={compactRowHeight}
            subRowHeight={subRowHeight}
            hasPinnedColumns={hasPinnedColumns}
            extendedPinnedColumnDivider={extendedPinnedColumnDivider}
            virtualized={virtualized}
            // @ts-ignore
            table={table}
            ref={tableBodyRef}
          />
        </TableBodyContainer>
      </ScrollSyncPane>
      {showBottomFade && <TableBottomFade />}
      {hasHiddenRows && !loading && !error && (
        <>
          {/* Separator with expand/collapse control */}
          <TableSeparatorRow
            v2={v2}
            showBottomBorder={!v2 && !areHiddenRowsShown}
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
                  <ChevronsIn size="$icon.12" color="$neutral3" />
                ) : (
                  <ChevronsOut size="$icon.12" color="$neutral3" />
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
                  extendedPinnedColumnDivider={extendedPinnedColumnDivider}
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
