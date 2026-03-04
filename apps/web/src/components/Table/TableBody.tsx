import { CellContext, flexRender, RowData } from '@tanstack/react-table'
import { forwardRef, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { WifiError } from 'ui/src/components/icons/WifiError'
import { breakpoints } from 'ui/src/theme'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from '~/components/Table/constants'
import { ErrorModal } from '~/components/Table/ErrorBox'
import { CellContainer, DataRow, NoDataFoundTableRow } from '~/components/Table/styled'
import { TableRow } from '~/components/Table/TableRow'
import { useTableSize } from '~/components/Table/TableSizeProvider'
import { TableBodyProps } from '~/components/Table/types'
import { getColumnSizingStyles } from '~/components/Table/utils'
import { ThemedText } from '~/theme/components'

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
    hasPinnedColumns = false,
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

  if (isOffline) {
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
        <ThemedText.BodySecondary>
          <Trans i18nKey="error.noData" />
        </ThemedText.BodySecondary>
      </NoDataFoundTableRow>
    )
  }

  return (
    <Flex ref={ref} position="relative" gap={!hasPinnedColumns ? '$spacing2' : undefined}>
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
