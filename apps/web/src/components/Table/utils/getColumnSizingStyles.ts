import { Column, RowData } from '@tanstack/react-table'
import { CSSProperties } from 'react'
import type { TableColumnMeta } from '~/components/Table/types'

/**
 * Returns sizing styles for table columns (width and flexGrow).
 */
export function getColumnSizingStyles<Data extends RowData>(column: Column<Data, unknown>): CSSProperties {
  const metaFlexGrow = (column.columnDef.meta as TableColumnMeta | undefined)?.flexGrow
  const size = column.getSize()

  const styles: CSSProperties = {
    width: size,
  }

  // Pinned columns must not flex with row content — otherwise header/body dividers drift per row.
  if (column.getIsPinned()) {
    styles.minWidth = size
    styles.maxWidth = size
    styles.flexShrink = 0
    styles.flexGrow = 0
  } else if (metaFlexGrow !== undefined) {
    // Only override flexGrow if explicitly set in meta
    styles.flexGrow = metaFlexGrow
  }

  return styles
}
