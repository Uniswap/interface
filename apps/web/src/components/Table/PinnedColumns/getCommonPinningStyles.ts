import { Column, RowData } from '@tanstack/react-table'
import { spacing, zIndexes } from '@universe/mycelium'
import { CSSProperties } from 'react'
import type { TableColumnMeta } from '~/components/Table/types'
import { getColumnSizingStyles } from '~/components/Table/utils/getColumnSizingStyles'

/**
 * Minimal shape this helper actually reads off a `useSporeColors()` result — kept structural
 * (not `ReturnType<typeof useSporeColors>`) so callers still on either the legacy or the
 * mycelium color hook can pass their result through unchanged.
 */
interface PinningColors {
  surface1: { val: string }
  surface2: { val: string }
  surface3: { val: string }
}

export function getCommonPinningStyles<Data extends RowData>({
  column,
  colors,
  isHeader = false,
  embeddedInExpandableGroup = false,
  hidePinnedColumnBorder = false,
}: {
  column: Column<Data, unknown>
  colors: PinningColors
  isHeader?: boolean
  /** Expanded expandable parent row shell uses `$surface2`; pinned cells must match. */
  embeddedInExpandableGroup?: boolean
  /** When a header extension draws the divider, omit per-cell borders. */
  hidePinnedColumnBorder?: boolean
}): CSSProperties & { background: string } {
  // `background` is narrowed to `string` above (not CSSProperties['background']'s wider union)
  // since this function only ever assigns `pinnedSurfaceColor` or `'transparent'`, both strings;
  // callers that destructure it out don't need to cast it back down.
  const isPinned = column.getIsPinned()
  const isLastPinnedColumn = column.getIsLastColumn('left')
  const bodySurfaceColor = embeddedInExpandableGroup ? colors.surface2.val : colors.surface1.val
  const meta = column.columnDef.meta as TableColumnMeta | undefined
  // Opaque so values scrolling beneath the pinned column can't ghost through it.
  const pinnedSurfaceColor = !isHeader ? bodySurfaceColor : colors.surface2.val

  return {
    ...getColumnSizingStyles(column),
    left: isPinned === 'left' ? `${column.getStart('left')}px` : 0,
    position: isPinned ? 'sticky' : 'relative',
    zIndex: isPinned ? zIndexes.default : zIndexes.background,
    background: isPinned ? pinnedSurfaceColor : 'transparent',
    borderRight: isLastPinnedColumn && !hidePinnedColumnBorder ? `1px solid ${colors.surface3.val}` : undefined,
    paddingLeft: column.getIsFirstColumn() ? `${spacing.spacing8}px` : 0,
    paddingRight: column.getIsLastColumn() || isLastPinnedColumn ? `${spacing.spacing8}px` : 0,
    marginRight: meta?.trailingMarginCss,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
  }
}
