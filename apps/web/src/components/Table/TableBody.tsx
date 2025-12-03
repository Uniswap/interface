import { CellContext, flexRender, RowData } from '@tanstack/react-table'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from 'components/Table/constants'
import { ErrorModal } from 'components/Table/ErrorBox'
import { CellContainer, DataRow, NoDataFoundTableRow } from 'components/Table/styled'
import { TableRow } from 'components/Table/TableRow'
import { useTableSize } from 'components/Table/TableSizeProvider'
import { TableBodyProps } from 'components/Table/types'
import { getColumnSizingStyles } from 'components/Table/utils'
import { forwardRef, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { breakpoints } from 'ui/src/theme'

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
  }: TableBodyProps<T>,
  ref: React.Ref<HTMLDivElement>,
) {
  const rows = table.getRowModel().rows
  const { width: tableWidth } = useTableSize()
  const skeletonRowHeight = useMemo(
    () =>
      tableWidth <= breakpoints.lg
        ? (propCompactRowHeight ?? ROW_HEIGHT_MOBILE_WEB)
        : (propRowHeight ?? ROW_HEIGHT_DESKTOP),
    [tableWidth, propRowHeight, propCompactRowHeight],
  )

  if (loading || error) {
    return (
      <>
        <Flex>
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
        <ThemedText.BodySecondary>
          <Trans i18nKey="error.noData" />
        </ThemedText.BodySecondary>
      </NoDataFoundTableRow>
    )
  }

  return (
    <Flex ref={ref} position="relative">
      {rows.map((row) => (
        <TableRow<T>
          key={row.id}
          row={row}
          v2={v2}
          rowWrapper={rowWrapper}
          rowHeight={propRowHeight}
          compactRowHeight={propCompactRowHeight}
        />
      ))}
    </Flex>
  )
}

export const TableBody = forwardRef(TableBodyInner) as unknown as <T extends RowData>(
  p: TableBodyProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => JSX.Element
