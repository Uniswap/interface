import { useCallback, useMemo, useState } from 'react'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import {
  EXPANDABLE_ASSET_TABLE_ROW_HEIGHT,
  RWA_TABLE_INITIAL_OVERSCAN_ROWS,
  RWA_TABLE_MAX_ROWS,
} from '~/pages/Explore/rwa/table/expandableAssetTableConstants'

/**
 * Client-side infinite scroll for RWA Explore category tables.
 *
 * Initially renders only the rows that fill the viewport plus a small overscan
 * buffer, then reveals another viewport-worth of rows each time the user scrolls
 * near the bottom — up to {@link RWA_TABLE_MAX_ROWS}.
 *
 * `loadMore` is `undefined` once everything available (or the cap) is shown so the
 * table stops triggering further loads.
 */
export function useRwaTablePagination(totalRowCount: number): {
  displayCount: number
  loadMore: ((params: { onComplete?: () => void }) => void) | undefined
} {
  const { fullHeight } = useDeviceDimensions()

  // Rows needed to fill the viewport, plus a small buffer. Used both for the
  // initial render and as the per-scroll page size.
  const pageSize = useMemo(
    () => Math.ceil(fullHeight / EXPANDABLE_ASSET_TABLE_ROW_HEIGHT) + RWA_TABLE_INITIAL_OVERSCAN_ROWS,
    [fullHeight],
  )

  const [displayCount, setDisplayCount] = useState(pageSize)

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      setDisplayCount((current) => Math.min(current + pageSize, RWA_TABLE_MAX_ROWS))
      onComplete?.()
    },
    [pageSize],
  )

  const cappedTotal = Math.min(totalRowCount, RWA_TABLE_MAX_ROWS)

  return {
    displayCount,
    loadMore: displayCount < cappedTotal ? loadMore : undefined,
  }
}
