import { Cell, flexRender, Row, RowData } from '@tanstack/react-table'
import { memo, useMemo } from 'react'
import { LinkProps, useLocation } from 'react-router'
import { Flex } from 'ui/src'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { breakpoints } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from '~/components/Table/constants'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { CellContainer, DataRow, TableRowLink } from '~/components/Table/styled'
import { useTableSize } from '~/components/Table/TableSizeProvider'

interface TableCellProps<T extends RowData> {
  cell: Cell<T, unknown>
  v2?: boolean
  /** Passed so memo re-renders when row expansion toggles (cell reference may not change). */
  isExpanded?: boolean
}

function TableCellComponent<T extends RowData>({
  cell,
  v2 = true,
  isExpanded: _isExpanded,
}: TableCellProps<T>): JSX.Element {
  const isPinned = cell.column.getIsPinned()
  const isFirstPinnedColumn = isPinned && cell.column.getIsFirstColumn('left')
  const colors = useSporeColors()
  const { background, ...positionStyles } = getCommonPinningStyles({ column: cell.column, colors, v2, isHeader: false })

  return (
    <CellContainer
      style={positionStyles}
      backgroundColor={background}
      borderTopLeftRadius={v2 && isFirstPinnedColumn ? '$rounded12' : undefined}
      borderBottomLeftRadius={v2 && isFirstPinnedColumn ? '$rounded12' : undefined}
      overflow="hidden"
      $group-hover={{
        backgroundColor: isPinned && v2 ? '$surface1Hovered' : 'unset',
      }}
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
  subRowHeight?: number
  /** Passed so memo re-renders when expansion toggles (row reference may not change). */
  isExpanded?: boolean
  dimmed?: boolean
}

function TableRowComponent<T extends RowData>({
  row,
  v2 = true,
  rowWrapper,
  rowHeight: propRowHeight,
  compactRowHeight: propCompactRowHeight,
  subRowHeight: propSubRowHeight,
  isExpanded: _isExpanded,
  dimmed,
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
  const { pathname } = useLocation()
  const navState = { ...rowOriginal.linkState, from: pathname }

  const rowTestId = rowOriginal.testId
  const { width: tableWidth } = useTableSize()
  const rowHeight = useMemo(() => {
    if (row.depth > 0 && propSubRowHeight !== undefined) {
      return propSubRowHeight
    }
    return tableWidth <= breakpoints.lg
      ? (propCompactRowHeight ?? ROW_HEIGHT_MOBILE_WEB)
      : (propRowHeight ?? ROW_HEIGHT_DESKTOP)
  }, [row.depth, propSubRowHeight, tableWidth, propCompactRowHeight, propRowHeight])

  const cells = row
    .getVisibleCells()
    .map((cell: Cell<T, unknown>) => <TableCell<T> key={cell.id} cell={cell} v2={v2} isExpanded={_isExpanded} />)

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
          <TableRowLink to={rowOriginal.link} state={navState} data-testid={rowTestId}>
            <DataRow height={rowHeight} v2={v2} dimmed={dimmed}>
              {cells}
            </DataRow>
          </TableRowLink>
        ) : (
          <DataRow height={rowHeight} data-testid={rowTestId} v2={v2} dimmed={dimmed}>
            {cells}
          </DataRow>
        )}
      </Flex>
    </Trace>
  )
  return rowWrapper ? rowWrapper(row, rowContent) : rowContent
}

export const TableRow = memo(TableRowComponent) as typeof TableRowComponent
