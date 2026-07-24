import { CellContext, flexRender, Row, RowData } from '@tanstack/react-table'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { forwardRef, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, styled, Text, useSporeColors } from 'ui/src'
import { WifiError } from 'ui/src/components/icons/WifiError'
import { breakpoints } from 'ui/src/theme'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from '~/components/Table/constants'
import { ErrorModal } from '~/components/Table/ErrorBox'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { CellContainer, DataRow, TableRowBase } from '~/components/Table/styled'
import { TableRow } from '~/components/Table/TableRow'
import { useTableSize } from '~/components/Table/TableSizeProvider'
import { TableTopLevelRow } from '~/components/Table/TableTopLevelRow'
import { TableBodyProps } from '~/components/Table/types'

const ROW_GAP_PX = 2

const NoDataFoundTableRow = styled(TableRowBase, {
  justifyContent: 'center',
})

function TableBodyInner<T extends RowData>(
  {
    table,
    loading,
    error,
    rowWrapper,
    topLevelRowWrapper,
    subRowsWrapper,
    renderUnifiedExpandableRow,
    loadingRowsCount = 20,
    rowHeight: propRowHeight,
    compactRowHeight: propCompactRowHeight,
    subRowHeight: propSubRowHeight,
    hasPinnedColumns = false,
    extendedPinnedColumnDivider = false,
    dimmed,
    virtualized = false,
  }: TableBodyProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const rows = table.getRowModel().rows
  const { width: tableWidth } = useTableSize()
  const colors = useSporeColors()
  const isOffline = useIsOffline()
  const { t } = useTranslation()

  const skeletonRowHeight = useMemo(
    () =>
      tableWidth <= breakpoints.lg
        ? (propCompactRowHeight ?? ROW_HEIGHT_MOBILE_WEB)
        : (propRowHeight ?? ROW_HEIGHT_DESKTOP),
    [tableWidth, propRowHeight, propCompactRowHeight],
  )

  const numericRowGap = !hasPinnedColumns ? ROW_GAP_PX : 0
  const topLevelRows = useMemo(() => rows.filter((row) => row.depth === 0), [rows])

  const flatEstimateSize = useCallback(() => skeletonRowHeight + numericRowGap, [skeletonRowHeight, numericRowGap])

  const [scrollMargin, setScrollMargin] = useState(0)

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollMargin(node?.offsetTop ?? 0)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const flatRowVirtualizer = useWindowVirtualizer({
    count: virtualized ? rows.length : 0,
    estimateSize: flatEstimateSize,
    overscan: 5,
    scrollMargin,
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
    (row: Row<T>, rowGap: string | undefined) => {
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
          <Flex gap={rowGap} paddingTop={rowGap}>
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
    (row: Row<T>, rowGapValue: string | undefined) => (
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

  const rowGap = !hasPinnedColumns ? '$spacing2' : undefined

  if (isOffline && rows.length === 0) {
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

  if (loading || error) {
    return (
      <>
        <Flex ref={setContainerRef} gap={!hasPinnedColumns ? '$spacing2' : undefined}>
          {Array.from({ length: loadingRowsCount }, (_, rowIndex) => (
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
        {error && <ErrorModal header={t('common.errorLoadingData.error')} subtitle={t('error.dataUnavailable')} />}
      </>
    )
  }

  if (!rows.length) {
    return (
      <NoDataFoundTableRow ref={setContainerRef} py="$spacing20">
        <Text variant="body2" color="$neutral2">
          {t('error.noData')}
        </Text>
      </NoDataFoundTableRow>
    )
  }

  if (virtualized) {
    const virtualItems = flatRowVirtualizer.getVirtualItems()
    return (
      <Flex ref={setContainerRef} position="relative" style={{ height: flatRowVirtualizer.getTotalSize() }}>
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index]!
          return (
            <Flex
              key={virtualRow.key}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              style={{
                height: virtualRow.size - numericRowGap,
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                willChange: 'transform',
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
