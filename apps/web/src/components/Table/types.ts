import { ColumnDef, Row, RowData, Table as TanstackTable } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { TableVirtualizationMode } from '~/components/Table/hooks/useTableVirtualizer'

/** Overrides the error overlay shown over the skeleton rows when `error` is set. */
export type TableErrorState = {
  title?: ReactNode
  description?: ReactNode
  onRetry?: () => void
  retryText?: string
}

/** Overrides the "no data" message shown when the table has zero rows (e.g. a filter-aware prompt). */
export type TableEmptyState = {
  title?: ReactNode
  description?: ReactNode
  /** Optional action rendered under the message (e.g. a "Clear filters" button). */
  action?: ReactNode
}

export type RenderUnifiedExpandableRow<T extends RowData> = (
  row: Row<T>,
  ctx: {
    renderTableRow: () => JSX.Element
    /** Full-width table rows for each expanded sub-row (e.g. per-issuer metrics). */
    renderSubTableRows: () => JSX.Element
    isExpanded: boolean
  },
) => JSX.Element

/** Optional metadata on column definitions (read in TableRow, sizing helpers, etc.). */
export interface TableColumnMeta {
  flexGrow?: number
  /** When true, the cell container uses overflow visible (e.g. popovers that extend past the cell). */
  overflowVisible?: boolean
  /** CSS width expression overriding the rendered column width in header and body cells (e.g. a scroll-linked collapse). Tanstack sizing is unaffected. */
  widthOverride?: string
  /** CSS margin expression rendered after this column in header and body cells — e.g. a full-bleed table's scroll-end gutter, or scroll travel consumed by a column transition. Contributes to the rows' scrollable width. */
  trailingMarginCss?: string
  /** `touch-action` for this column's header and body cells — e.g. holding back horizontal panning so a pinned column can absorb the gesture itself. Unset leaves the browser default. */
  touchActionCss?: string
  /** Drop the 95% translucency from this column's pinned cell background. Set it where content scrolling underneath would otherwise ghost through a narrow pinned column. */
  opaquePinnedBackground?: boolean
}

export type TableBodyProps<T extends RowData = unknown> = {
  table: TanstackTable<T>
  loading?: boolean
  error?: boolean
  errorState?: TableErrorState
  emptyState?: TableEmptyState
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  topLevelRowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  subRowsWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  renderUnifiedExpandableRow?: RenderUnifiedExpandableRow<T>
  loadingRowsCount?: number
  rowHeight?: number
  compactRowHeight?: number
  subRowHeight?: number
  hasPinnedColumns?: boolean
  dimmed?: boolean
  /** Draw one pinned-column guide from the header instead of per-row borders (mWeb). */
  extendedPinnedColumnDivider?: boolean
  /** Flat row virtualization: scroll the window (e.g. Portfolio Activity) or the maxHeight container. Flat rows only — skips sub-row / expandable rendering. */
  virtualization?: TableVirtualizationMode
}

export type TableProps<T extends RowData = unknown> = {
  columns: ColumnDef<T, any>[]
  data: T[]
  loading?: boolean
  error?: boolean
  errorState?: TableErrorState
  emptyState?: TableEmptyState
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  /**
   * Extra px between the app header and the sticky header row, on top of the app header's own height.
   * Defaults to 0 (flush). Raise it where a sticky sibling needs the row to clear the app header by the
   * same amount — see the add-liquidity pool browser.
   */
  stickyTopOffset?: number
  defaultPinnedColumns?: string[]
  forcePinning?: boolean
  hideHeader?: boolean
  externalScrollSync?: boolean
  scrollGroup?: string
  // oxlint-disable-next-line max-params -- matches @tanstack/react-table getRowId signature
  getRowId?: (originalRow: T, index: number, parent?: Row<T>) => string
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  topLevelRowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  subRowsWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
  renderUnifiedExpandableRow?: RenderUnifiedExpandableRow<T>
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
  /** When true, shows native browser scrollbar instead of hiding it */
  showScrollbar?: boolean
  /** CSS width expression for the pinned region when columns use `TableColumnMeta.widthOverride` — keeps the pinned divider overlay and left scroll button aligned with the rendered width. */
  pinnedWidthOverride?: string
  /** When true, only visible flat rows are rendered (window scroll, or container scroll when maxHeight is set). Does not support getSubRows / renderUnifiedExpandableRow — expansion UI is skipped. */
  virtualized?: boolean
  /**
   * For tables that scroll with the window (no maxHeight): clip the body's vertical overflow instead of
   * letting it be `auto`. `overflow-x: auto` otherwise coerces `overflow-y` to `auto`, making the wrapper
   * a ~3px scroll box that captures wheel deltas (page scrolls in miniscule increments).
   */
  windowScrollY?: boolean
}
