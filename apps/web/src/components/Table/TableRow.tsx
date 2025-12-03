import { Cell, flexRender, Row, RowData } from '@tanstack/react-table'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from 'components/Table/constants'
import { CellContainer, DataRow, TableRowLink } from 'components/Table/styled'
import { useTableSize } from 'components/Table/TableSizeProvider'
import { getCommonPinningStyles } from 'components/Table/utils'
import { memo, useMemo } from 'react'
import { LinkProps } from 'react-router'
import { Flex } from 'ui/src'
import { UseSporeColorsReturn, useSporeColors } from 'ui/src/hooks/useSporeColors'
import { breakpoints } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface TableCellProps<T extends RowData> {
  cell: Cell<T, unknown>
  colors: UseSporeColorsReturn
  v2?: boolean
}

function TableCellComponent<T extends RowData>({ cell, colors, v2 = true }: TableCellProps<T>): JSX.Element {
  const isPinned = cell.column.getIsPinned()
  const isFirstPinnedColumn = isPinned && cell.column.getIsFirstColumn('left')
  const pinnedStyles = getCommonPinningStyles({ column: cell.column, colors, v2, isHeader: false })

  return (
    <CellContainer
      style={pinnedStyles}
      borderTopLeftRadius={v2 && isFirstPinnedColumn ? '$rounded12' : undefined}
      borderBottomLeftRadius={v2 && isFirstPinnedColumn ? '$rounded12' : undefined}
      overflow="hidden"
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </CellContainer>
  )
}

const TableCell = memo(TableCellComponent) as typeof TableCellComponent

interface TableRowProps<T extends RowData> {
  row: Row<T>
  v2: boolean
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  rowHeight?: number
  compactRowHeight?: number
}

function TableRowComponent<T extends RowData>({
  row,
  v2 = true,
  rowWrapper,
  rowHeight: propRowHeight,
  compactRowHeight: propCompactRowHeight,
}: TableRowProps<T>): JSX.Element {
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
    () =>
      tableWidth <= breakpoints.lg
        ? (propCompactRowHeight ?? ROW_HEIGHT_MOBILE_WEB)
        : (propRowHeight ?? ROW_HEIGHT_DESKTOP),
    [tableWidth, propCompactRowHeight, propRowHeight],
  )
  const cells = row
    .getVisibleCells()
    .map((cell: Cell<T, unknown>) => <TableCell<T> key={cell.id} cell={cell} colors={colors} v2={v2} />)

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

export const TableRow = memo(TableRowComponent) as typeof TableRowComponent
