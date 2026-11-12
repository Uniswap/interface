import { CellContext, flexRender, Row, RowData } from '@tanstack/react-table'
import { Flex, Text } from '@universe/mycelium'
import type { SpaceValue } from '@universe/mycelium/compat'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { WifiError } from '@universe/mycelium/icons/WifiError'
import { useSporeColors, BREAKPOINT_PX } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ROW_HEIGHT_DESKTOP,
  ROW_HEIGHT_MOBILE_WEB,
  TABLE_ROW_GAP_PX,
  TABLE_ROW_GAP_TOKEN,
} from '~/components/Table/constants'
import { ErrorModal } from '~/components/Table/ErrorBox'
import { TableBodyRenderMode, useTableBodyRenderMode } from '~/components/Table/hooks/useTableBodyRenderMode'
import { useTableVirtualizer } from '~/components/Table/hooks/useTableVirtualizer'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { CellContainer, DataRow, TableRowBase } from '~/components/Table/styled'
import { TableRow } from '~/components/Table/TableRow'
import { useTableSize } from '~/components/Table/TableSizeProvider'
import { TableTopLevelRow } from '~/components/Table/TableTopLevelRow'
import { TableBodyProps } from '~/components/Table/types'
import { StaticSkeletonContext } from '~/components/Tokens/loading'

// The error overlay is centered against the skeleton block (top: 50%). On window-scroll tables the
// container height equals content height, so a full-length skeleton would push the message below the
// fold — cap the error backdrop to keep it visible without scrolling.
const ERROR_SKELETON_ROW_COUNT = 8

const NoDataFoundTableRow = forwardRef<HTMLDivElement, React.ComponentProps<typeof TableRowBase>>(
  function NoDataFoundTableRow(props, ref) {
    return <TableRowBase ref={ref} justifyContent="center" {...props} />
  },
)

function TableBodyInner<T extends RowData>(
  {
    table,
    loading,
    error,
    errorState,
    emptyState,
    rowWrapper,
    topLevelRowWrapper,
    subRowsWrapper,
    renderUnifiedExpandableRow,
    loadingRowsCount = 20,
    rowHeight: propRowHeight,
    compactRowHeight: propCompactRowHeight,
    subRowHeight: propSubRowHeight,
    rowGap: propRowGap,
    hasPinnedColumns = false,
    extendedPinnedColumnDivider = false,
    dimmed,
    virtualization,
  }: TableBodyProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const rows = table.getRowModel().rows
  const { width: tableWidth } = useTableSize()
  const colors = useSporeColors()
  const renderMode = useTableBodyRenderMode({ loading: !!loading, error: !!error, rowCount: rows.length })
  const { t } = useTranslation()

  const skeletonRowHeight = useMemo(
    () =>
      tableWidth <= BREAKPOINT_PX.lg
        ? (propCompactRowHeight ?? ROW_HEIGHT_MOBILE_WEB)
        : (propRowHeight ?? ROW_HEIGHT_DESKTOP),
    [tableWidth, propRowHeight, propCompactRowHeight],
  )

  const numericRowGap = hasPinnedColumns ? 0 : (propRowGap ?? TABLE_ROW_GAP_PX)
  const rowGap: SpaceValue | undefined = hasPinnedColumns ? undefined : (propRowGap ?? TABLE_ROW_GAP_TOKEN)
  const topLevelRows = useMemo(() => rows.filter((row) => row.depth === 0), [rows])

  const flatEstimateSize = useCallback(() => skeletonRowHeight + numericRowGap, [skeletonRowHeight, numericRowGap])

  const { virtualizer: flatRowVirtualizer, setContainerRef } = useTableVirtualizer({
    mode: virtualization,
    count: rows.length,
    estimateSize: flatEstimateSize,
    forwardedRef: ref,
  })

  const renderTableRow = useCallback(
    (row: Row<T>) => {
      const embeddedInExpandableGroup = Boolean(renderUnifiedExpandableRow && row.subRows.length > 0)
      const embeddedInIssuerPanel = Boolean(renderUnifiedExpandableRow && row.depth > 0)
      const activeRowWrapper = embeddedInExpandableGroup && row.getCanExpand() ? undefined : rowWrapper

      return (
        <TableRow<T>
          row={row}
          rowWrapper={activeRowWrapper}
          rowHeight={propRowHeight}
          compactRowHeight={propCompactRowHeight}
          subRowHeight={propSubRowHeight}
          isExpanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
          dimmed={dimmed}
          embeddedInExpandableGroup={embeddedInExpandableGroup}
          embeddedInIssuerPanel={embeddedInIssuerPanel}
          extendedPinnedColumnDivider={extendedPinnedColumnDivider}
        />
      )
    },
    [
      rowWrapper,
      renderUnifiedExpandableRow,
      propRowHeight,
      propCompactRowHeight,
      propSubRowHeight,
      dimmed,
      extendedPinnedColumnDivider,
    ],
  )

  const renderSubRows = useCallback(
    (row: Row<T>, subRowGap: SpaceValue | undefined) => {
      const subRows = row.subRows
      if (subRows.length === 0) {
        return null
      }

      const subRowElements = subRows.map((subRow) => (
        <TableRow<T>
          key={subRow.id}
          row={subRow}
          rowWrapper={rowWrapper}
          rowHeight={propRowHeight}
          compactRowHeight={propCompactRowHeight}
          subRowHeight={propSubRowHeight}
          dimmed={dimmed}
          extendedPinnedColumnDivider={extendedPinnedColumnDivider}
        />
      ))
      const subRowsContent = subRowsWrapper ? subRowsWrapper(row, <>{subRowElements}</>) : <>{subRowElements}</>

      return (
        <HeightAnimator
          open={row.getIsExpanded()}
          animation="quick"
          unmountChildrenWhenCollapsed
          // overflow-y: hidden would coerce overflow-x to auto (CSS disallows mixing visible with a clipped axis), breaking sticky pinned columns
          styleProps={{ '$platform-web': { overflowY: 'clip', overflowX: 'visible' } }}
        >
          <Flex gap={subRowGap} paddingTop={subRowGap}>
            {subRowsContent}
          </Flex>
        </HeightAnimator>
      )
    },
    [
      rowWrapper,
      subRowsWrapper,
      propRowHeight,
      propCompactRowHeight,
      propSubRowHeight,
      dimmed,
      extendedPinnedColumnDivider,
    ],
  )

  const renderTopLevelRow = useCallback(
    (row: Row<T>, rowGapValue: SpaceValue | undefined) => (
      <TableTopLevelRow
        row={row}
        isExpanded={row.getIsExpanded()}
        rowGap={rowGapValue}
        renderTableRow={renderTableRow}
        renderSubRows={renderSubRows}
        topLevelRowWrapper={topLevelRowWrapper}
        renderUnifiedExpandableRow={renderUnifiedExpandableRow}
      />
    ),
    [renderTableRow, renderSubRows, topLevelRowWrapper, renderUnifiedExpandableRow],
  )

  if (renderMode === TableBodyRenderMode.Offline) {
    return (
      <NoDataFoundTableRow ref={setContainerRef} py="$spacing20">
        <Flex row centered justifyContent="center" gap="$gap8" py="$spacing4">
          <WifiError color="$neutral2" size="$icon.20" />
          <Text color="$neutral2" variant="subheading1">
            {t('explore.networkError')}
          </Text>
        </Flex>
      </NoDataFoundTableRow>
    )
  }

  if (renderMode === TableBodyRenderMode.Skeleton) {
    const skeletonRowCount = error ? Math.min(loadingRowsCount, ERROR_SKELETON_ROW_COUNT) : loadingRowsCount
    return (
      <StaticSkeletonContext.Provider value={!!error}>
        <Flex ref={setContainerRef} gap={rowGap}>
          {Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
            <DataRow key={`skeleton-row-${rowIndex}`} height={skeletonRowHeight}>
              {table.getAllColumns().map((column, columnIndex) => (
                <CellContainer
                  key={`skeleton-row-${rowIndex}-column-${columnIndex}`}
                  style={getCommonPinningStyles({
                    column,
                    colors,
                    isHeader: false,
                    hidePinnedColumnBorder: extendedPinnedColumnDivider,
                  })}
                >
                  {flexRender(column.columnDef.cell, {} as CellContext<T, any>)}
                </CellContainer>
              ))}
            </DataRow>
          ))}
        </Flex>
        {error && (
          <ErrorModal
            header={errorState?.title ?? t('common.errorLoadingData.error')}
            subtitle={errorState?.description ?? t('error.dataUnavailable')}
            onRetry={errorState?.onRetry}
            retryText={errorState?.retryText}
          />
        )}
      </StaticSkeletonContext.Provider>
    )
  }

  if (renderMode === TableBodyRenderMode.Empty) {
    return (
      <NoDataFoundTableRow ref={setContainerRef} py="$spacing20">
        {emptyState ? (
          <Flex centered gap="$gap8" py="$spacing4">
            {emptyState.title && (
              <Text variant="subheading2" color="$neutral1">
                {emptyState.title}
              </Text>
            )}
            {emptyState.description && (
              <Text variant="body3" color="$neutral2" textAlign="center">
                {emptyState.description}
              </Text>
            )}
            {emptyState.action}
          </Flex>
        ) : (
          <Text variant="body2" color="$neutral2">
            {t('error.noData')}
          </Text>
        )}
      </NoDataFoundTableRow>
    )
  }

  if (virtualization) {
    // Flat rows only: renderTableRow, not renderTopLevelRow / renderSubRows / renderUnifiedExpandableRow.
    const virtualItems = flatRowVirtualizer.getVirtualItems()
    return (
      <Flex ref={setContainerRef} position="relative" style={{ height: flatRowVirtualizer.getTotalSize() }}>
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index]!
          return (
            <Flex
              key={virtualRow.key}
              position="absolute"
              left={0}
              width="100%"
              style={{
                height: virtualRow.size - numericRowGap,
                // `top`, not translateY: iOS WebKit composites a transformed row around its sticky pinned cell,
                // ~2MB per row. Container virtualizer has scrollMargin 0, so the subtraction is a no-op there.
                top: virtualRow.start - flatRowVirtualizer.options.scrollMargin,
              }}
            >
              {renderTableRow(row)}
            </Flex>
          )
        })}
      </Flex>
    )
  }

  return (
    <Flex ref={setContainerRef} position="relative" gap={rowGap}>
      {topLevelRows.map((row) => (
        <Flex key={row.id} width="100%">
          {renderTopLevelRow(row, rowGap)}
        </Flex>
      ))}
    </Flex>
  )
}

export const TableBody = forwardRef(TableBodyInner) as unknown as <T extends RowData>(
  p: TableBodyProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => JSX.Element
