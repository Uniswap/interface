import { Cell, flexRender, Row, RowData } from '@tanstack/react-table'
import { memo, useMemo } from 'react'
import { Link, LinkProps, useLocation } from 'react-router'
import { Flex, styled } from 'ui/src'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { breakpoints } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from '~/components/Table/constants'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { CellContainer, DataRow } from '~/components/Table/styled'
import { useTableSize } from '~/components/Table/TableSizeProvider'
import type { TableColumnMeta } from '~/components/Table/types'

const TableRowLink = styled(Link, {
  cursor: 'pointer',
  '$platform-web': {
    textDecoration: 'none',
  },
})

interface TableCellProps<T extends RowData> {
  cell: Cell<T, unknown>
  v2?: boolean
  /** Passed so memo re-renders when row expansion toggles (cell reference may not change). */
  isExpanded?: boolean
  embeddedInExpandableGroup?: boolean
  embeddedInIssuerPanel?: boolean
  extendedPinnedColumnDivider?: boolean
  selected?: boolean
}

function TableCellComponent<T extends RowData>({
  cell,
  v2 = true,
  isExpanded: _isExpanded,
  embeddedInExpandableGroup,
  embeddedInIssuerPanel,
  extendedPinnedColumnDivider,
  selected,
}: TableCellProps<T>): JSX.Element {
  const isPinned = cell.column.getIsPinned()
  const isFirstPinnedColumn = isPinned && cell.column.getIsFirstColumn('left')
  const colors = useSporeColors()
  const { background, ...positionStyles } = getCommonPinningStyles({
    column: cell.column,
    colors,
    v2,
    isHeader: false,
    embeddedInExpandableGroup,
    hidePinnedColumnBorder: extendedPinnedColumnDivider,
  })

  const overflowVisible = Boolean((cell.column.columnDef.meta as TableColumnMeta | undefined)?.overflowVisible)

  // Pinned cells paint their own opaque background, so they must echo the row's selected fill
  // ($surface3) — otherwise only the unpinned part of a selected row would be highlighted.
  // Unpinned cells stay transparent and let the selected DataRow background show through.
  return (
    <CellContainer
      style={positionStyles}
      backgroundColor={selected && isPinned ? '$surface3' : background}
      borderTopLeftRadius={v2 && isFirstPinnedColumn ? '$rounded12' : undefined}
      borderBottomLeftRadius={v2 && isFirstPinnedColumn ? '$rounded12' : undefined}
      overflow={overflowVisible ? 'visible' : 'hidden'}
      $group-hover={{
        backgroundColor: selected
          ? isPinned
            ? '$surface3'
            : 'unset'
          : isPinned && v2 && embeddedInExpandableGroup
            ? '$surface2Hovered'
            : isPinned && v2 && !embeddedInIssuerPanel
              ? '$surface1Hovered'
              : 'unset',
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
  embeddedInExpandableGroup?: boolean
  embeddedInIssuerPanel?: boolean
  extendedPinnedColumnDivider?: boolean
}

function TableRowComponent<T extends RowData>({
  row,
  v2,
  rowWrapper,
  rowHeight: propRowHeight,
  compactRowHeight: propCompactRowHeight,
  subRowHeight: propSubRowHeight,
  isExpanded: _isExpanded,
  dimmed,
  embeddedInExpandableGroup,
  embeddedInIssuerPanel,
  extendedPinnedColumnDivider,
}: TableRowProps<T>): JSX.Element {
  const analyticsContext = useTrace()
  const rowOriginal = row.original as {
    linkState: LinkProps['state']
    testId: string
    selected?: boolean
    analytics?: {
      elementName: ElementName
      properties: Record<string, unknown>
    }
  }
  const selected = rowOriginal.selected ?? false
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

  /** Shell owns background when expanded; collapsed parent uses `DataRow` hover (full scroll width). */
  const embeddedInExpandableShell = embeddedInExpandableGroup && _isExpanded === true

  const cells = row
    .getVisibleCells()
    .map((cell: Cell<T, unknown>) => (
      <TableCell<T>
        key={cell.id}
        cell={cell}
        v2={v2}
        isExpanded={_isExpanded}
        embeddedInExpandableGroup={embeddedInExpandableShell}
        embeddedInIssuerPanel={embeddedInIssuerPanel}
        extendedPinnedColumnDivider={extendedPinnedColumnDivider}
        selected={selected}
      />
    ))

  const rowContent = (
    <Trace
      logPress
      element={rowOriginal.analytics?.elementName}
      properties={{
        ...rowOriginal.analytics?.properties,
        ...analyticsContext,
      }}
    >
      <Flex {...(embeddedInIssuerPanel ? {} : { group: true })}>
        {'link' in rowOriginal && typeof rowOriginal.link === 'string' ? (
          <TableRowLink to={rowOriginal.link} state={navState} data-testid={rowTestId}>
            <DataRow
              height={rowHeight}
              v2={v2}
              dimmed={dimmed}
              selected={selected}
              embeddedInExpandableGroup={embeddedInExpandableShell}
              embeddedInIssuerPanel={embeddedInIssuerPanel}
            >
              {cells}
            </DataRow>
          </TableRowLink>
        ) : (
          <DataRow
            height={rowHeight}
            data-testid={rowTestId}
            v2={v2}
            dimmed={dimmed}
            selected={selected}
            embeddedInExpandableGroup={embeddedInExpandableShell}
            embeddedInIssuerPanel={embeddedInIssuerPanel}
          >
            {cells}
          </DataRow>
        )}
      </Flex>
    </Trace>
  )
  return rowWrapper ? rowWrapper(row, rowContent) : rowContent
}

export const TableRow = memo(TableRowComponent) as typeof TableRowComponent
