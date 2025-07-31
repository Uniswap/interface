import { useEffect, useRef, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

export function useInfiniteScroll({
  onLoadMore,
  hasNextPage,
  isFetching,
  threshold = 0.1,
}: {
  onLoadMore: () => void | Promise<void>
  hasNextPage: boolean
  isFetching: boolean
  threshold?: number
}) {
  const sentinelRef = useRef<HTMLElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Memoize callback to prevent observer recreation
  const stableOnLoadMore = useEvent(async () => {
    if (isLoading) {
      return
    }

    setIsLoading(true)
    try {
      await onLoadMore()
    } catch (error) {
      logger.warn('useInfiniteScroll', 'Failed to load more items', error)
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    const element = sentinelRef.current
    if (!element) {
      return () => {}
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetching && !isLoading) {
          stableOnLoadMore()
        }
      },
      { threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasNextPage, isFetching, stableOnLoadMore, threshold, isLoading])

  return { sentinelRef }
}
