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
}): { sentinelRef: React.MutableRefObject<HTMLElement | null> } {
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
      logger.warn('useInfiniteScroll', 'Failed to load more items', error as string)
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    const element = sentinelRef.current
    if (!element) {
      return (): void => {}
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry && entry.isIntersecting && hasNextPage && !isFetching && !isLoading) {
          stableOnLoadMore().catch((error) => {
            logger.warn('useInfiniteScroll', 'Failed to handle intersection', error as string)
          })
        }
      },
      { threshold },
    )

    observer.observe(element)
    return (): void => observer.disconnect()
  }, [hasNextPage, isFetching, stableOnLoadMore, threshold, isLoading])

  return { sentinelRef }
}
