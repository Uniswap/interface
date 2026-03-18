import { ApolloError } from '@apollo/client'
import { ColumnDef, Row, RowData, Table as TanstackTable } from '@tanstack/react-table'

export type TableBodyProps<T extends RowData = unknown> = {
  table: TanstackTable<T>
  loading?: boolean
  error?: ApolloError | boolean
  v2: boolean
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  loadingRowsCount?: number
  rowHeight?: number
  compactRowHeight?: number
  subRowHeight?: number
  hasPinnedColumns?: boolean
  dimmed?: boolean
}

export type TableProps<T extends RowData = unknown> = {
  columns: ColumnDef<T, any>[]
  data: T[]
  loading?: boolean
  error?: ApolloError | boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  defaultPinnedColumns?: string[]
  forcePinning?: boolean
  v2: boolean
  hideHeader?: boolean
  externalScrollSync?: boolean
  scrollGroup?: string
  getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  loadingRowsCount?: number
  rowHeight?: number
  compactRowHeight?: number
  /** When set, sub-rows (expanded children) use this height. E.g. 40 for token table child rows. */
  subRowHeight?: number
  /** When true, only one row can be expanded at a time (accordion behavior). */
  singleExpandedRow?: boolean
  centerArrows?: boolean
  headerTestId?: string
  getSubRows?: (row: T) => T[] | undefined
  // Hidden rows feature (all optional)
  hiddenRows?: T[]
  showHiddenRowsLabel?: string
  hideHiddenRowsLabel?: string
}
