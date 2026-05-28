import { useEffect, useRef, useState } from 'react'
import { useDebounce } from '~/hooks/useDebounce'

const SHOW_RETURN_TO_TOP_OFFSET = 500
const LOAD_MORE_BOTTOM_OFFSET = 50

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
  const [scrollPosition, setScrollPosition] = useState<{
    distanceFromTop: number
    distanceToBottom: number
  }>({
    distanceFromTop: 0,
    distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
  })
  const { distanceFromTop, distanceToBottom } = useDebounce(scrollPosition, 125)
  const lastLoadedLengthRef = useRef(0)
  const canLoadMore = useRef(true)
  const dataLengthRef = useRef(dataLength)
  const prevLoadMoreRef = useRef(loadMore)

  useEffect(() => {
    dataLengthRef.current = dataLength
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
    // Use parentElement because the actual scrolling container is the parent wrapper,
    // not the table body div itself (which is a child of the scrollable container)
    const scrollableElement = maxHeight ? tableBodyRef.current?.parentElement : window
    if (!scrollableElement) {
      return undefined
    }
    const updateScrollPosition = () => {
      if (scrollableElement instanceof HTMLDivElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement
        setScrollPosition({
          distanceFromTop: scrollTop,
          distanceToBottom: scrollHeight - scrollTop - clientHeight,
        })
      } else if (scrollableElement === window) {
        setScrollPosition({
          distanceFromTop: scrollableElement.scrollY,
          distanceToBottom: document.body.scrollHeight - scrollableElement.scrollY - scrollableElement.innerHeight,
        })
      }
    }
    scrollableElement.addEventListener('scroll', updateScrollPosition)
    return () => scrollableElement.removeEventListener('scroll', updateScrollPosition)
  }, [loadMore, maxHeight, loadingMore, tableBodyRef])

  useEffect(() => {
    const scrollableElement = maxHeight ? tableBodyRef.current?.parentElement : window
    const shouldLoadMoreFromScroll = distanceToBottom < LOAD_MORE_BOTTOM_OFFSET
    let shouldLoadMoreFromViewportHeight = false

    if (!shouldLoadMoreFromScroll) {
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
      (shouldLoadMoreFromScroll || shouldLoadMoreFromViewportHeight) &&
      !loadingMore &&
      loadMore &&
      canLoadMore.current &&
      !error &&
      !loading
    ) {
      setLoadingMore(true)
      // Manually update scroll position to prevent re-triggering
      setScrollPosition({
        distanceFromTop: SHOW_RETURN_TO_TOP_OFFSET,
        distanceToBottom: LOAD_MORE_BOTTOM_OFFSET,
      })
      loadMore({
        onComplete: () => {
          setLoadingMore(false)
          // dataLength would be stale here (captured when loadMore was called); use ref for latest value when onComplete runs
          const currentLength = dataLengthRef.current
          if (currentLength === lastLoadedLengthRef.current) {
            canLoadMore.current = false
          } else {
            lastLoadedLengthRef.current = currentLength
          }
        },
      })
    }
  }, [dataLength, distanceFromTop, distanceToBottom, error, loadMore, loading, loadingMore, maxHeight, tableBodyRef])

  return { loadingMore }
}
