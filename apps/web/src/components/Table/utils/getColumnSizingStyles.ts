import { Column, RowData } from '@tanstack/react-table'
import { CSSProperties } from 'react'
import type { TableColumnMeta } from '~/components/Table/types'

/**
 * Returns sizing styles for table columns (width and flexGrow).
 */
export function getColumnSizingStyles<Data extends RowData>(column: Column<Data, unknown>): CSSProperties {
  const metaFlexGrow = (column.columnDef.meta as TableColumnMeta | undefined)?.flexGrow

  const styles: CSSProperties = {
    width: column.getSize(),
  }

  // Only override flexGrow if explicitly set in meta
  if (metaFlexGrow !== undefined) {
    styles.flexGrow = metaFlexGrow
  }

  return styles
}
