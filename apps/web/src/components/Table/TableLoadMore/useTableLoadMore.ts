import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'utilities/src/time/timing'

const LOAD_MORE_BOTTOM_OFFSET = 50
// A client-side filter can discard entire fetched pages, so completions that grow nothing get a
// small budget before auto-fetch stops — unbounded, an all-filtered stretch pages through the
// source's full history (or shows an infinite spinner when nothing ever matches).
const MAX_AUTO_FETCHES_WITHOUT_GROWTH = 3

export function useTableLoadMore(params: {
  tableBodyRef: React.RefObject<HTMLDivElement | null>
  maxHeight: number | undefined
  loadMore: ((params: { onComplete?: () => void }) => void) | undefined
  dataLength: number
  loading: boolean | undefined
  error: unknown
}) {
  const { tableBodyRef, maxHeight, loadMore, dataLength, loading, error } = params

  const [loadingMore, setLoadingMore] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(false)
  const debouncedIsNearBottom = useDebounce(isNearBottom, 125)
  const lastLoadedLengthRef = useRef(0)
  const noGrowthFetchesRef = useRef(0)
  const canLoadMore = useRef(true)
  const dataLengthRef = useRef(dataLength)
  const prevLoadMoreRef = useRef(loadMore)

  useEffect(() => {
    dataLengthRef.current = dataLength
    // Any change to the rendered row set (a page landed, a filter toggled) grants a fresh budget
    // and re-arms load-more — covers filter changes that swap the rows without any fetch
    // (onComplete never fires there), and corrects a budget spent on a stale pre-render count.
    noGrowthFetchesRef.current = 0
    canLoadMore.current = true
  }, [dataLength])

  // Reset load-more state when switching between pagination modes (e.g. experiment off → on).
  // Otherwise canLoadMore stays false or loadingMore stays true and infinite scroll never runs again.
  useEffect(() => {
    if (loadMore !== prevLoadMoreRef.current) {
      canLoadMore.current = true
      if (!loadMore) {
        setLoadingMore(false)
      }
      prevLoadMoreRef.current = loadMore
    }
  }, [loadMore])

  useEffect(() => {
    if (!loadMore) {
      return undefined
    }
    // Use parentElement because the actual scrolling container is the parent wrapper,
    // not the table body div itself (which is a child of the scrollable container)
    const scrollableElement = maxHeight ? tableBodyRef.current?.parentElement : window
    if (!scrollableElement) {
      return undefined
    }
    let rafId: number | null = null
    const updateScrollPosition = () => {
      if (rafId !== null) {
        return
      }
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (scrollableElement instanceof HTMLDivElement) {
          const { scrollTop, scrollHeight, clientHeight } = scrollableElement
          setIsNearBottom(scrollHeight - scrollTop - clientHeight < LOAD_MORE_BOTTOM_OFFSET)
        } else if (scrollableElement === window) {
          setIsNearBottom(
            document.body.scrollHeight - scrollableElement.scrollY - scrollableElement.innerHeight <
              LOAD_MORE_BOTTOM_OFFSET,
          )
        }
      })
    }
    scrollableElement.addEventListener('scroll', updateScrollPosition)
    return () => {
      scrollableElement.removeEventListener('scroll', updateScrollPosition)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [loadMore, maxHeight, loadingMore, tableBodyRef])

  useEffect(() => {
    const scrollableElement = maxHeight ? tableBodyRef.current?.parentElement : window
    let shouldLoadMoreFromViewportHeight = false

    if (!debouncedIsNearBottom) {
      if (!maxHeight && scrollableElement === window) {
        const contentHeight = document.body.scrollHeight
        const viewportHeight = window.innerHeight
        shouldLoadMoreFromViewportHeight = contentHeight <= viewportHeight
      } else if (scrollableElement instanceof HTMLDivElement) {
        const { scrollHeight, clientHeight } = scrollableElement
        shouldLoadMoreFromViewportHeight = scrollHeight <= clientHeight
      }
    }

    if (
      (debouncedIsNearBottom || shouldLoadMoreFromViewportHeight) &&
      // Completions without rendered-row growth spend from a budget only a row-set change restores
      // — the latch below alone can't cap them, since loadMore is recreated per fetch and the
      // mode-switch effect above re-arms on its identity change. Applies to the empty table (all
      // rows filtered out) and the sparse one (rows that never fill the viewport) alike.
      noGrowthFetchesRef.current < MAX_AUTO_FETCHES_WITHOUT_GROWTH &&
      !loadingMore &&
      loadMore &&
      canLoadMore.current &&
      !error &&
      !loading
    ) {
      setLoadingMore(true)
      // Latch off so a still-true debounce cannot re-trigger until the next near-bottom edge
      setIsNearBottom(false)
      loadMore({
        onComplete: () => {
          setLoadingMore(false)
          // dataLength would be stale here (captured when loadMore was called); use ref for latest value when onComplete runs
          const currentLength = dataLengthRef.current
          if (currentLength === lastLoadedLengthRef.current) {
            noGrowthFetchesRef.current += 1
            canLoadMore.current = false
          } else {
            noGrowthFetchesRef.current = 0
            lastLoadedLengthRef.current = currentLength
          }
        },
      })
    }
  }, [dataLength, debouncedIsNearBottom, error, loadMore, loading, loadingMore, maxHeight, tableBodyRef])

  return { loadingMore }
}
