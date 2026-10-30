import type { ColumnDef, RowData } from '@tanstack/react-table'
import {
  DEFAULT_COLLAPSED_COLUMN_WIDTH,
  getCollapsiblePinnedColumnMeta,
  type PinnedColumnWidths,
} from '~/components/Table/PinnedColumns/collapse/utils'
import type { TableColumnMeta } from '~/components/Table/types'

/** Mirrors how tanstack derives a column id when `id` is omitted: a string `accessorKey`, dots to underscores. */
function getColumnDefId<T extends RowData>(column: ColumnDef<T, any>): string | undefined {
  if (column.id !== undefined) {
    return column.id
  }
  const accessorKey = 'accessorKey' in column ? column.accessorKey : undefined
  return typeof accessorKey === 'string' ? accessorKey.replace(/\./g, '_') : undefined
}

/**
 * Pairs `Table`'s `collapsiblePinnedColumnId` with its column def: the column's `size` is the
 * expanded width, `meta.collapsedWidth` (default: the logo-only width) the collapsed one, and the
 * collapse meta is merged over whatever meta the column already carries (e.g. `flexGrow`). Columns
 * come back untouched, with no widths, when no column matches — a column omitted at this
 * breakpoint is simply not collapsible — or when the match has no fixed `size` to collapse from.
 */
export function resolveCollapsiblePinnedColumn<T extends RowData>({
  columns,
  collapsiblePinnedColumnId,
}: {
  columns: ColumnDef<T, any>[]
  collapsiblePinnedColumnId: string | undefined
}): { columns: ColumnDef<T, any>[]; widths: PinnedColumnWidths | undefined } {
  const column =
    collapsiblePinnedColumnId === undefined
      ? undefined
      : columns.find((candidate) => getColumnDefId(candidate) === collapsiblePinnedColumnId)
  if (!column || typeof column.size !== 'number') {
    return { columns, widths: undefined }
  }
  const meta = column.meta as TableColumnMeta | undefined
  const widths: PinnedColumnWidths = {
    expandedWidth: column.size,
    collapsedWidth: meta?.collapsedWidth ?? DEFAULT_COLLAPSED_COLUMN_WIDTH,
  }
  const collapsibleColumn: ColumnDef<T, any> = {
    ...column,
    meta: { ...meta, ...getCollapsiblePinnedColumnMeta(widths) },
  }
  return {
    columns: columns.map((candidate) => (candidate === column ? collapsibleColumn : candidate)),
    widths,
  }
}
