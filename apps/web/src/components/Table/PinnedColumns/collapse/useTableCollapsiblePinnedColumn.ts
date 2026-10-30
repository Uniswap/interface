import type { RowData, Table } from '@tanstack/react-table'
import { isDevEnv } from '@universe/environment'
import { type RefObject, useEffect } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useCollapsiblePinnedColumnScope } from '~/components/Table/PinnedColumns/collapse/CollapsiblePinnedColumnScope'
import { useCollapsiblePinnedColumn } from '~/components/Table/PinnedColumns/collapse/useCollapsiblePinnedColumn'
import type { PinnedColumnWidths } from '~/components/Table/PinnedColumns/collapse/utils'

/**
 * Drives `Table`'s `collapsiblePinnedColumnId` once the tanstack instance exists: the collapse only
 * works at the scroll container's left edge (its consumed-scroll margin and hit-testing assume
 * nothing pinned sits before the column), so it stays off until the column is the first pinned one.
 * Inside a `CollapsiblePinnedColumnScope` the scope runs the collapse for every table it wraps.
 */
export function useTableCollapsiblePinnedColumn<T extends RowData>({
  table,
  collapsiblePinnedColumnId,
  widths,
  rootRef,
}: {
  table: Table<T>
  collapsiblePinnedColumnId: string | undefined
  /** From `resolveCollapsiblePinnedColumn`; undefined when no column collapses. */
  widths: PinnedColumnWidths | undefined
  rootRef: RefObject<HTMLElement | null>
}): void {
  const firstPinnedColumnId = table.getLeftVisibleLeafColumns()[0]?.id
  const activeWidths = widths && firstPinnedColumnId === collapsiblePinnedColumnId ? widths : undefined
  const isPinnedBehindAnotherColumn = Boolean(
    widths && firstPinnedColumnId && firstPinnedColumnId !== collapsiblePinnedColumnId,
  )

  // Primitive deps only: `widths` is a fresh object whenever the columns are rebuilt, which would
  // re-log the same misconfiguration on every such render.
  useEffect(() => {
    if (isDevEnv() && isPinnedBehindAnotherColumn) {
      logger.warn(
        'useTableCollapsiblePinnedColumn',
        'collapsiblePinnedColumnId',
        `'${collapsiblePinnedColumnId}' must be the first pinned column to collapse; '${firstPinnedColumnId}' is pinned before it`,
      )
    }
  }, [isPinnedBehindAnotherColumn, firstPinnedColumnId, collapsiblePinnedColumnId])

  const registerWithScope = useCollapsiblePinnedColumnScope()
  useCollapsiblePinnedColumn({ rootRef, widths: registerWithScope ? undefined : activeWidths })
  useEffect(
    () => (registerWithScope && activeWidths ? registerWithScope(activeWidths) : undefined),
    [registerWithScope, activeWidths],
  )
}
