import { CellContext, flexRender, RowData } from '@tanstack/react-table'
import { forwardRef, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, styled, Text } from 'ui/src'
import { WifiError } from 'ui/src/components/icons/WifiError'
import { breakpoints } from 'ui/src/theme'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from '~/components/Table/constants'
import { ErrorModal } from '~/components/Table/ErrorBox'
import { CellContainer, DataRow, TableRowBase } from '~/components/Table/styled'
import { TableRow } from '~/components/Table/TableRow'
import { useTableSize } from '~/components/Table/TableSizeProvider'
import { TableBodyProps } from '~/components/Table/types'
import { getColumnSizingStyles } from '~/components/Table/utils/getColumnSizingStyles'
const NoDataFoundTableRow = styled(TableRowBase, {
  justifyContent: 'center',
})

function TableBodyInner<T extends RowData>(
  {
    table,
    loading,
    error,
    v2 = true,
    rowWrapper,
    loadingRowsCount = 20,
    rowHeight: propRowHeight,
    compactRowHeight: propCompactRowHeight,
    subRowHeight: propSubRowHeight,
    hasPinnedColumns = false,
    dimmed,
  }: TableBodyProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const rows = table.getRowModel().rows
  const { width: tableWidth } = useTableSize()
  const isOffline = useIsOffline()
  const { t } = useTranslation()
  const skeletonRowHeight = useMemo(
    () =>
      tableWidth <= breakpoints.lg
        ? (propCompactRowHeight ?? ROW_HEIGHT_MOBILE_WEB)
        : (propRowHeight ?? ROW_HEIGHT_DESKTOP),
    [tableWidth, propRowHeight, propCompactRowHeight],
  )

  if (isOffline && rows.length === 0) {
    return (
      <NoDataFoundTableRow py="$spacing20">
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
        <Flex gap={!hasPinnedColumns && v2 ? '$spacing2' : undefined}>
          {Array.from({ length: loadingRowsCount }, (_, rowIndex) => (
            <DataRow key={`skeleton-row-${rowIndex}`} height={skeletonRowHeight} v2={v2}>
              {table.getAllColumns().map((column, columnIndex) => (
                <CellContainer
                  key={`skeleton-row-${rowIndex}-column-${columnIndex}`}
                  style={getColumnSizingStyles(column)}
                >
                  {flexRender(column.columnDef.cell, {} as CellContext<T, any>)}
                </CellContainer>
              ))}
            </DataRow>
          ))}
        </Flex>
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
        <Text variant="body2" color="$neutral2">
          <Trans i18nKey="error.noData" />
        </Text>
      </NoDataFoundTableRow>
    )
  }

  const topLevelRows = rows.filter((row) => row.depth === 0)
  const rowGap = !hasPinnedColumns ? '$spacing2' : undefined

  return (
    <Flex ref={ref} position="relative" gap={rowGap}>
      {topLevelRows.map((row) => {
        const subRows = row.subRows
        const hasSubRows = subRows.length > 0
        return (
          <Flex key={row.id} width="100%">
            <TableRow<T>
              row={row}
              v2={v2}
              rowWrapper={rowWrapper}
              rowHeight={propRowHeight}
              compactRowHeight={propCompactRowHeight}
              subRowHeight={propSubRowHeight}
              isExpanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
              dimmed={dimmed}
            />
            {hasSubRows && (
              <HeightAnimator open={row.getIsExpanded()} animation="quick" unmountChildrenWhenCollapsed>
                <Flex gap={rowGap} paddingTop={rowGap}>
                  {subRows.map((subRow) => (
                    <TableRow<T>
                      key={subRow.id}
                      row={subRow}
                      v2={v2}
                      rowWrapper={rowWrapper}
                      rowHeight={propRowHeight}
                      compactRowHeight={propCompactRowHeight}
                      subRowHeight={propSubRowHeight}
                      dimmed={dimmed}
                    />
                  ))}
                </Flex>
              </HeightAnimator>
            )}
          </Flex>
        )
      })}
    </Flex>
  )
}

export const TableBody = forwardRef(TableBodyInner) as unknown as <T extends RowData>(
  p: TableBodyProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => JSX.Element
