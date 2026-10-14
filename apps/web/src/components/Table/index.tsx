import { flexRender, getCoreRowModel, getExpandedRowModel, RowData, useReactTable } from '@tanstack/react-table'
import { Flex, type FlexCompatProps, Separator, Text, TouchableArea, zIndexes } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { ChevronsIn } from '@universe/mycelium/icons/ChevronsIn'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import useParentSize from '@visx/responsive/lib/hooks/useParentSize'
import { forwardRef, PropsWithChildren, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollSync, ScrollSyncPane } from 'react-scroll-sync'
import { useEvent } from 'utilities/src/react/hooks'
import { useTableBodyRenderMode, TableBodyRenderMode } from '~/components/Table/hooks/useTableBodyRenderMode'
import { useTableBottomFade } from '~/components/Table/hooks/useTableBottomFade'
import { useTableExpandedState } from '~/components/Table/hooks/useTableExpandedState'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { TablePinnedColumnOverlay } from '~/components/Table/PinnedColumns/TablePinnedColumnOverlay'
import { usePinnedColumns } from '~/components/Table/PinnedColumns/usePinnedColumns'
import { CellContainer, TableRowBase, type TableRowBaseProps } from '~/components/Table/styled'
import { TableBody } from '~/components/Table/TableBody'
import { TableLoadMoreIndicator } from '~/components/Table/TableLoadMore/TableLoadMoreIndicator'
import { useTableLoadMore } from '~/components/Table/TableLoadMore/useTableLoadMore'
import { TableBottomFade, TableScrollMask } from '~/components/Table/TableScrollMask'
import { TableSideScrollButtons } from '~/components/Table/TableSideScrollButtons/TableSideScrollButtons'
import { useTableSideScrollButtons } from '~/components/Table/TableSideScrollButtons/useTableSideScrollButtons'
import { TableSizeProvider } from '~/components/Table/TableSizeProvider'
import { TableProps } from '~/components/Table/types'
import { computeBodyMaxHeight } from '~/components/Table/utils/computeBodyMaxHeight'
import { getPinnedRegionRightEdgePx } from '~/components/Table/utils/getColumnSizingStyles'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

const TableContainer = forwardRef<HTMLDivElement, FlexCompatProps>(function TableContainer(props, ref) {
  // No margin on purpose: the legacy `m: '0 auto 24px auto'` was invalid per-side CSS browsers dropped,
  // and rendering it for real cancels the flex stretch that lets tables fill their parent.
  return <Flex ref={ref} centered className="scrollbar-hidden" {...props} />
})

// When container virtualization is active, useTableVirtualizer resolves THIS element as its
// scroll parent (via the body node's parentElement). Keep it the direct parent of TableBody's
// root node and the sole scroll container, or container virtualization silently breaks.
type TableBodyContainerProps = FlexCompatProps & { windowScrollY?: boolean; hasHiddenRows?: boolean }
const TableBodyContainer = forwardRef<HTMLDivElement, TableBodyContainerProps>(function TableBodyContainer(
  { windowScrollY, hasHiddenRows, ...rest },
  ref,
) {
  return (
    <Flex
      ref={ref}
      width="100%"
      position="relative"
      className="scrollbar-hidden"
      justifyContent="flex-start"
      borderStyle="solid"
      borderBottomRightRadius="$rounded12"
      borderBottomLeftRadius="$rounded12"
      borderWidth={0}
      // Window-scroll tables (no maxHeight): clip vertical overflow so the wrapper isn't a ~3px scroll box
      // that traps wheel deltas. Must be 'hidden' (not 'visible', which coerces back to 'auto' under
      // overflow-x: auto). Opt-in so height-constrained tables keep their internal 'auto' scroll.
      // Merged into one object: `$platform-web` is a single prop, so a second spread would replace
      // it wholesale instead of merging, silently dropping overscrollBehaviorX/overflowX below.
      $platform-web={{
        overscrollBehaviorX: 'none',
        overflowX: 'auto',
        overflowY: windowScrollY ? 'hidden' : 'auto',
      }}
      // `overflowAnchor` isn't on the curated `$platform-web` surface yet; the style escape hatch
      // carries it. Sorting reorders keyed row nodes; without this, browser scroll anchoring
      // follows a moved row to an arbitrary scroll position.
      style={{ overflowAnchor: 'none' }}
      {...(hasHiddenRows ? { borderBottomRightRadius: 0, borderBottomLeftRadius: 0, borderBottomWidth: 0 } : {})}
      {...rest}
    />
  )
})

type HiddenTableScrollContainerProps = FlexCompatProps & { windowScrollY?: boolean }
const HiddenTableScrollContainer = forwardRef<HTMLDivElement, HiddenTableScrollContainerProps>(
  function HiddenTableScrollContainer({ windowScrollY, ...rest }, ref) {
    return (
      <Flex
        ref={ref}
        width="100%"
        position="relative"
        className="scrollbar-hidden"
        justifyContent="flex-start"
        borderStyle="solid"
        borderBottomRightRadius="$rounded12"
        borderBottomLeftRadius="$rounded12"
        borderWidth={0}
        // Same wheel-trap guard as TableBodyContainer: on window-scroll tables the expanded hidden-rows
        // wrapper must clip vertical overflow so it isn't a scroll box. Height is auto (== content) here,
        // so 'hidden' clips nothing while keeping sticky pinned columns working (the non-window-scroll
        // 'visible' branch is what makes sticky work at all). Merged into one object: `$platform-web` is
        // a single prop, so a second spread would replace it wholesale instead of merging.
        $platform-web={{
          overscrollBehaviorX: 'none',
          overflowX: 'auto',
          overflowY: windowScrollY ? 'hidden' : 'visible',
        }}
        {...rest}
      />
    )
  },
)

const TableSeparatorRow = forwardRef<HTMLDivElement, FlexCompatProps>(function TableSeparatorRow(props, ref) {
  return (
    <Flex
      ref={ref}
      centered
      row
      gap="$spacing12"
      py="$spacing8"
      px="$spacing16"
      borderStyle="solid"
      borderWidth={0}
      width="100%"
      {...props}
    />
  )
})

const TableHead = (
  props: PropsWithChildren<{
    $isSticky: boolean
    $top: number
    /** Clearance between the app header and the header row; the head paints across it. */
    $topGap: number
    mb?: FlexCompatProps['mb']
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
    {/* Masks the $topGap band between the app header and this row, which rows would otherwise scroll
        through. Absolutely positioned on purpose: a flex child here is absorbed by the header row and
        makes it taller (the whole point of the gap is space *above* the table, not a taller header). */}
    {props.$isSticky && props.$topGap > 0 && (
      <Flex
        position="absolute"
        top={-props.$topGap}
        left={0}
        right={0}
        height={props.$topGap}
        backgroundColor="$surface1"
      />
    )}
    {props.children}
  </Flex>
)

type HeaderRowProps = TableRowBaseProps & { dimmed?: boolean }
const HeaderRow = forwardRef<HTMLDivElement, HeaderRowProps>(function HeaderRow({ dimmed, ...rest }, ref) {
  return (
    <TableRowBase
      ref={ref}
      width="unset"
      scrollbarWidth="none"
      className="scrollbar-hidden"
      transition="unset"
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      $platform-web={{
        overscrollBehavior: 'none',
        overflow: 'auto',
      }}
      {...(dimmed ? { opacity: 0.4 } : {})}
      {...rest}
    />
  )
})

// oxlint-disable-next-line complexity
export function Table<T extends RowData>({
  columns,
  data,
  loading,
  error,
  errorState,
  emptyState,
  loadMore,
  maxWidth,
  maxHeight,
  defaultPinnedColumns = [],
  forcePinning = false,
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
  collapseExpandedRowsKey,
  centerArrows = false,
  headerTestId,
  getSubRows,
  hiddenRows,
  showHiddenRowsLabel,
  hideHiddenRowsLabel,
  showScrollbar,
  pinnedWidthOverride,
  virtualized = false,
  // Window virtualization (virtualized + no maxHeight) resolves to the 'window' scroll variant, which
  // needs the wrapper's vertical overflow clipped to avoid the wheel trap. Keep the two in sync by
  // default; still overridable by an explicit prop.
  windowScrollY = virtualized && !maxHeight,
  stickyTopOffset = 0,
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
  const { expanded, onExpandedChange } = useTableExpandedState({ singleExpandedRow, collapseExpandedRowsKey })
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

  const rowContentMinWidthPx = table.getTotalSize()

  const tableSize = useMemo(() => ({ width, height, top, left }), [width, height, top, left])
  const computedBodyMaxHeight = useMemo(() => {
    if (!maxHeight) {
      return 'unset' as const
    }
    const bodyHeight = hideHeader ? maxHeight : maxHeight - headerHeight
    const itemHeight = rowHeight ?? compactRowHeight

    return computeBodyMaxHeight({ bodyHeight, itemHeight, hasPinnedColumns })
  }, [maxHeight, hideHeader, headerHeight, rowHeight, compactRowHeight, hasPinnedColumns])

  const extendedPinnedColumnDivider = hasPinnedColumns
  const bodyRenderMode = useTableBodyRenderMode({
    loading: !!loading,
    error: !!error,
    rowCount: table.getRowModel().rows.length,
  })
  const showHiddenRowsSection = hasHiddenRows && !loading && !error
  const showPinnedColumnDivider =
    hasPinnedColumns &&
    (bodyRenderMode === TableBodyRenderMode.Rows ||
      bodyRenderMode === TableBodyRenderMode.Skeleton ||
      showHiddenRowsSection)
  const pinnedColumnOverlayLeftPx = getPinnedRegionRightEdgePx({
    table,
    containerWidthPx: width,
    totalColumnSizePx: rowContentMinWidthPx,
  })

  const content = (
    <TableContainer maxWidth={maxWidth} maxHeight={maxHeight} position="relative" ref={parentRef}>
      {showPinnedColumnDivider ? (
        <TablePinnedColumnOverlay
          leftPx={pinnedColumnOverlayLeftPx}
          leftOverride={pinnedWidthOverride}
          color={colors.surface3.val}
        />
      ) : null}
      <>
        <TableHead $isSticky={isSticky} $top={headerHeight + stickyTopOffset} $topGap={stickyTopOffset} mb="$spacing2">
          {hasPinnedColumns && (
            <TableSideScrollButtons
              {...sideScrollButtons}
              table={table}
              isSticky={isSticky}
              pinnedWidthOverride={pinnedWidthOverride}
            />
          )}

          {!hideHeader && (
            <ScrollSyncPane group={scrollGroup}>
              <HeaderRow testID={headerTestId} dimmed={!!error}>
                {table.getFlatHeaders().map((header) => (
                  <CellContainer
                    key={header.id}
                    style={getCommonPinningStyles({
                      column: header.column,
                      colors,
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
        {hasPinnedColumns && sideScrollButtons.showRightFadeOverlay && (
          <TableScrollMask zIndex={zIndexes.default} borderBottomRightRadius="$rounded12" right={0} />
        )}
      </>
      <ScrollSyncPane group={scrollGroup}>
        <TableBodyContainer
          maxHeight={computedBodyMaxHeight}
          windowScrollY={windowScrollY}
          hasHiddenRows={showHiddenRowsSection}
          {...(showScrollbar && { scrollbarWidth: 'thin' as const })}
        >
          <TableBody
            loading={loading}
            error={error}
            errorState={errorState}
            emptyState={emptyState}
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
            virtualization={virtualized ? (maxHeight ? 'container' : 'window') : undefined}
            // @ts-ignore
            table={table}
            ref={tableBodyRef}
          />
        </TableBodyContainer>
      </ScrollSyncPane>
      {showBottomFade && <TableBottomFade />}
      {showHiddenRowsSection && (
        <>
          {/* Separator with expand/collapse control */}
          <TableSeparatorRow
            borderBottomRightRadius={areHiddenRowsShown ? 0 : '$rounded12'}
            borderBottomLeftRadius={areHiddenRowsShown ? 0 : '$rounded12'}
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
            // overflow-y: hidden would coerce overflow-x to auto (CSS disallows mixing visible with a clipped axis), breaking sticky pinned columns
            styleProps={{ '$platform-web': { overflowY: 'clip', overflowX: 'visible' } }}
          >
            <ScrollSyncPane group={scrollGroup}>
              <HiddenTableScrollContainer windowScrollY={windowScrollY}>
                <TableBody
                  table={hiddenTable}
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
    <TableSizeProvider size={tableSize} rowContentMinWidthPx={rowContentMinWidthPx}>
      {externalScrollSync ? content : <ScrollSync horizontal>{content}</ScrollSync>}
    </TableSizeProvider>
  )
}
