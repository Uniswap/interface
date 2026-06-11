import { Column, RowData } from '@tanstack/react-table'
import { CSSProperties } from 'react'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { opacify, padding, zIndexes } from 'ui/src/theme'
import { getColumnSizingStyles } from '~/components/Table/utils/getColumnSizingStyles'

export function getCommonPinningStyles<Data extends RowData>({
  column,
  colors,
  v2 = true,
  isHeader = false,
  embeddedInExpandableGroup = false,
  hidePinnedColumnBorder = false,
}: {
  column: Column<Data, unknown>
  colors: ReturnType<typeof useSporeColors>
  v2?: boolean
  isHeader?: boolean
  /** Expanded expandable parent row shell uses `$surface2`; pinned cells must match. */
  embeddedInExpandableGroup?: boolean
  /** When a header extension draws the divider, omit per-cell borders. */
  hidePinnedColumnBorder?: boolean
}): CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastPinnedColumn = column.getIsLastColumn('left')
  const bodySurfaceColor = embeddedInExpandableGroup ? colors.surface2.val : colors.surface1.val

  return {
    ...getColumnSizingStyles(column),
    left: isPinned === 'left' ? `${column.getStart('left')}px` : 0,
    position: isPinned ? 'sticky' : 'relative',
    zIndex: isPinned ? zIndexes.default : zIndexes.background,
    background: isPinned ? opacify(95, !isHeader && v2 ? bodySurfaceColor : colors.surface2.val) : 'transparent', // F2 = 95% opacity
    borderRight: isLastPinnedColumn && !hidePinnedColumnBorder ? `1px solid ${colors.surface3.val}` : undefined,
    paddingLeft: column.getIsFirstColumn() ? `${padding.padding8}px` : 0,
    paddingRight: column.getIsLastColumn() || isLastPinnedColumn ? `${padding.padding8}px` : 0,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
  }
}
