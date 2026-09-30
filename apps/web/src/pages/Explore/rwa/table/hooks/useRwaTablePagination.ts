import { useDeviceDimensions } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useMemo, useState } from 'react'
import { useInfiniteLoadMore } from '~/hooks/useInfiniteLoadMore'
import {
  EXPANDABLE_ASSET_TABLE_ROW_SLOT_HEIGHT,
  RWA_TABLE_INITIAL_OVERSCAN_ROWS,
} from '~/pages/Explore/rwa/table/expandableAssetTableConstants'

/**
 * Infinite scroll for RWA Explore category tables.
 *
 * Initially renders only the rows that fill the viewport plus a small overscan
 * buffer, then reveals another viewport-worth of already-loaded rows each time the
 * user scrolls near the bottom. Once the window has consumed every loaded row, the
 * next scroll fetches the next server page instead.
 *
 * `loadMore` is `undefined` once everything available is shown and the server has
 * no more pages, so the table stops triggering further loads.
 */
export function useRwaTablePagination({
  rowsKey,
  loadedRowCount,
  filteredRowCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  /** Identity of the query serving the rows; the window restarts when it changes. */
  rowsKey: string
  /** Rows loaded from the server so far, before the search filter. */
  loadedRowCount: number
  /** Rows left after the search filter; the window slices these. */
  filteredRowCount: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}): {
  displayCount: number
  loadMore: ((params: { onComplete?: () => void }) => void) | undefined
} {
  const { fullHeight } = useDeviceDimensions()

  // Rows needed to fill the viewport, plus a small buffer. Used both for the
  // initial render and as the per-scroll page size.
  const pageSize = useMemo(
    () => Math.ceil(fullHeight / EXPANDABLE_ASSET_TABLE_ROW_SLOT_HEIGHT) + RWA_TABLE_INITIAL_OVERSCAN_ROWS,
    [fullHeight],
  )

  const [displayCount, setDisplayCount] = useState(pageSize)

  const [prevRowsKey, setPrevRowsKey] = useState(rowsKey)
  if (rowsKey !== prevRowsKey) {
    setPrevRowsKey(rowsKey)
    setDisplayCount(pageSize)
  }

  const hasHiddenRows = displayCount < filteredRowCount
  // Gated on the unfiltered count so a search filter, which the window fills from the loaded set,
  // never walks every remaining server page looking for matches.
  const canFetchNextPage = hasNextPage && displayCount >= loadedRowCount

  // Defers onComplete until the server page lands so the table's loading indicator stays up for
  // the fetch; revealing already-loaded rows completes synchronously.
  const fetchNextPageAndComplete = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage: canFetchNextPage,
    isFetchingNextPage,
  })

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (hasHiddenRows) {
        setDisplayCount((current) => current + pageSize)
        onComplete?.()
        return
      }
      // Grow the window ahead of the fetch so the new page is visible as soon as it lands, capped
      // one page past the loaded rows so a failed fetch can't inflate it further.
      setDisplayCount((current) => Math.min(current + pageSize, loadedRowCount + pageSize))
      fetchNextPageAndComplete({ onComplete })
    },
    [hasHiddenRows, pageSize, loadedRowCount, fetchNextPageAndComplete],
  )

  return {
    displayCount,
    loadMore: hasHiddenRows || canFetchNextPage ? loadMore : undefined,
  }
}
