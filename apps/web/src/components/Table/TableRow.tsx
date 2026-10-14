import { Cell, flexRender, Row, RowData } from '@tanstack/react-table'
import { Flex } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { memo, useMemo } from 'react'
import { Link, LinkProps, useLocation } from 'react-router'
import { breakpoints } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ROW_HEIGHT_DESKTOP, ROW_HEIGHT_MOBILE_WEB } from '~/components/Table/constants'
import { getCommonPinningStyles } from '~/components/Table/PinnedColumns/getCommonPinningStyles'
import { CellContainer, DataRow } from '~/components/Table/styled'
import { TableRowHoverContext } from '~/components/Table/TableRowHoverContext'
import { useTableSize } from '~/components/Table/TableSizeProvider'
import type { TableColumnMeta } from '~/components/Table/types'

// `Link` (react-router) has no compat primitive, so this rebuilds on the house styled() factory.
// Never rides a native bundle (apps/web only), so `platform: 'web'` legalizes the literal classes.
const TableRowLink = styled(Link, {
  platform: 'web',
  base: 'cursor-pointer no-underline',
})

interface TableCellProps<T extends RowData> {
  cell: Cell<T, unknown>
  /** Passed so memo re-renders when row expansion toggles (cell reference may not change). */
  isExpanded?: boolean
  embeddedInExpandableGroup?: boolean
  embeddedInIssuerPanel?: boolean
  extendedPinnedColumnDivider?: boolean
  selected?: boolean
}

function getCellGroupHoverBackgroundColor({
  isPinned,
  selected,
  embeddedInExpandableGroup,
  embeddedInIssuerPanel,
}: {
  isPinned: boolean
  selected?: boolean
  embeddedInExpandableGroup?: boolean
  embeddedInIssuerPanel?: boolean
}): '$surface3' | '$surface2Hovered' | '$surface1Hovered' | 'unset' | undefined {
  if (selected) {
    return isPinned ? '$surface3' : 'unset'
  }
  if (!isPinned) {
    return 'unset'
  }
  if (embeddedInExpandableGroup) {
    return '$surface2Hovered'
  }
  if (embeddedInIssuerPanel) {
    return undefined
  }
  return '$surface1Hovered'
}

function TableCellComponent<T extends RowData>({
  cell,
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
    isHeader: false,
    embeddedInExpandableGroup,
    hidePinnedColumnBorder: extendedPinnedColumnDivider,
  })

  const overflowVisible = Boolean((cell.column.columnDef.meta as TableColumnMeta | undefined)?.overflowVisible)

  // Pinned cells paint their own opaque background, so they must echo the row's selected fill
  // ($surface3) — otherwise only the unpinned part of a selected row would be highlighted.
  // Unpinned cells stay transparent and let the selected DataRow background show through.
  const groupHoverBackgroundColor = getCellGroupHoverBackgroundColor({
    isPinned: Boolean(isPinned),
    selected,
    embeddedInExpandableGroup,
    embeddedInIssuerPanel,
  })

  return (
    <CellContainer
      style={positionStyles}
      backgroundColor={selected && isPinned ? '$surface3' : background}
      borderTopLeftRadius={isFirstPinnedColumn && !embeddedInIssuerPanel ? '$rounded12' : undefined}
      borderBottomLeftRadius={isFirstPinnedColumn && !embeddedInIssuerPanel ? '$rounded12' : undefined}
      overflow={overflowVisible ? 'visible' : 'hidden'}
      $group-hover={groupHoverBackgroundColor ? { backgroundColor: groupHoverBackgroundColor } : undefined}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </CellContainer>
  )
}

const TableCell = memo(TableCellComponent) as typeof TableCellComponent

interface TableRowProps<T extends RowData> {
  row: Row<T>
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
  // React state, not the `$group-item-hover` CSS path: the CSS variant matches ANY ancestor anchor,
  // so nested/adjacent groups would slide every row's cells — per-row scoping needs a value.
  const { value: rowHovered, setTrue: onRowMouseEnter, setFalse: onRowMouseLeave } = useBooleanState(false)
  const rowOriginal = row.original as {
    linkState: LinkProps['state']
    /** '_blank' opens the row link in a new tab (external row links, e.g. quick launches → pools.trade). */
    linkTarget?: '_blank'
    testId: string
    selected?: boolean
    // Launches uses these to prefetch the detail page. Only wired on link rows.
    // onRowPressStart fires on pointerdown, before the click.
    onRowHoverStart?: () => void
    onRowHoverEnd?: () => void
    onRowFocus?: () => void
    onRowPressStart?: () => void
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
        isExpanded={_isExpanded}
        embeddedInExpandableGroup={embeddedInExpandableShell}
        embeddedInIssuerPanel={embeddedInIssuerPanel}
        extendedPinnedColumnDivider={extendedPinnedColumnDivider}
        selected={selected}
      />
    ))

  const rowContent = (
    // The hover Provider stays OUTSIDE the Trace: `logPress` clones its onClick onto its DIRECT
    // child, so that child has to be the DOM-rendering `Flex` or the click event never fires.
    <TableRowHoverContext.Provider value={embeddedInIssuerPanel ? undefined : rowHovered}>
      <Trace
        logPress
        element={rowOriginal.analytics?.elementName}
        properties={{
          ...rowOriginal.analytics?.properties,
          ...analyticsContext,
        }}
      >
        <Flex
          {...(embeddedInIssuerPanel
            ? {}
            : // Both anchor markers are load-bearing: `group: true` for legacy `$group-*` consumers,
              // `className: 'group'` for converted Tailwind `group-*` consumers.
              { group: true, className: 'group', onMouseEnter: onRowMouseEnter, onMouseLeave: onRowMouseLeave })}
        >
          {'link' in rowOriginal && typeof rowOriginal.link === 'string' ? (
            <TableRowLink
              to={rowOriginal.link}
              state={navState}
              target={rowOriginal.linkTarget}
              rel={rowOriginal.linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
              data-testid={rowTestId}
              onMouseEnter={rowOriginal.onRowHoverStart}
              onMouseLeave={rowOriginal.onRowHoverEnd}
              onFocus={rowOriginal.onRowFocus}
              onPointerDown={rowOriginal.onRowPressStart}
            >
              <DataRow
                height={rowHeight}
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
              testID={rowTestId}
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
    </TableRowHoverContext.Provider>
  )
  return rowWrapper ? rowWrapper(row, rowContent) : rowContent
}

export const TableRow = memo(TableRowComponent) as typeof TableRowComponent
