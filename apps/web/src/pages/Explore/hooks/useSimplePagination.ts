import { useCallback, useEffect, useReducer, useRef } from 'react'

type LoadMore = ({ onComplete }: { onComplete?: () => void }) => void

/**
 * Default delay (ms) before revealing the next page. With client-side ("fake") infinite scroll all
 * data is already loaded, so pagination is otherwise instantaneous and a table's load-more indicator
 * never gets a chance to paint. A small delay surfaces the loading state and paces the reveal.
 */
const DEFAULT_LOAD_MORE_DELAY_MS = 400

/**
 * Tracks client-side ("fake") infinite-scroll pagination over an already-loaded list.
 *
 * Because all data is present up front, revealing the next page is instantaneous. This hook:
 * - paces the reveal with a small delay so a table's load-more indicator is actually visible, and
 * - stops paginating (`loadMore` becomes `undefined`) once every loaded row is displayed, so the
 *   indicator doesn't appear after the full list is already shown.
 *
 * @param totalCount - Total number of loaded rows. When provided together with `pageSize`,
 *   `loadMore` is gated on whether more rows remain to reveal.
 * @param pageSize - Rows revealed per page; used with `totalCount` for end-of-list gating.
 * @param loadMoreDelayMs - Delay before revealing the next page. Pass `0` to reveal synchronously.
 *   Defaults to {@link DEFAULT_LOAD_MORE_DELAY_MS}.
 * @returns The current page (1-based), whether more rows remain, and a `loadMore` callback that is
 *   `undefined` once the full list is displayed.
 */
export function useSimplePagination({
  totalCount,
  pageSize,
  loadMoreDelayMs = DEFAULT_LOAD_MORE_DELAY_MS,
}: {
  totalCount?: number
  pageSize?: number
  loadMoreDelayMs?: number
} = {}): {
  page: number
  hasMore: boolean
  loadMore: LoadMore | undefined
} {
  const [page, incrementPage] = useReducer((current: number) => current + 1, 1)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // Gating is only applied when the caller provides both the total and the page size; otherwise the
  // total is unknown and we always allow loading more (original behavior).
  const hasMore = totalCount === undefined || pageSize === undefined || page * pageSize < totalCount

  const loadMore = useCallback<LoadMore>(
    ({ onComplete }) => {
      if (loadMoreDelayMs <= 0) {
        incrementPage()
        onComplete?.()
        return
      }
      // Defer the reveal so the load-more indicator is briefly visible, then increment the page and
      // signal completion together (both batched into a single render).
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        incrementPage()
        onComplete?.()
      }, loadMoreDelayMs)
    },
    [loadMoreDelayMs],
  )

  return { page, hasMore, loadMore: hasMore ? loadMore : undefined }
}
