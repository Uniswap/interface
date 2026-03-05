import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook that provides a loadMore callback compatible with Table's infinite scroll.
 * Uses refs and effects to ensure onComplete is called only after React has
 * re-rendered with new data, avoiding timing-based assumptions.
 */
export function useInfiniteLoadMore({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  dataLength,
}: {
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  dataLength: number
}): ({ onComplete }: { onComplete?: () => void }) => void {
  const onCompleteRef = useRef<(() => void) | undefined>(undefined)
  const prevDataLengthRef = useRef<number>(0)
  const prevWasFetchingRef = useRef<boolean>(false)

  // Call onComplete when fetch completes (isFetchingNextPage transitions true→false)
  // and either data changed or there are no more pages
  useEffect(() => {
    if (onCompleteRef.current && !isFetchingNextPage && prevWasFetchingRef.current) {
      if (dataLength !== prevDataLengthRef.current || !hasNextPage) {
        onCompleteRef.current()
        onCompleteRef.current = undefined
      }
    }
    prevWasFetchingRef.current = isFetchingNextPage
    prevDataLengthRef.current = dataLength
  }, [dataLength, isFetchingNextPage, hasNextPage])

  return useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (hasNextPage && !isFetchingNextPage) {
        onCompleteRef.current = onComplete
        fetchNextPage()
      } else {
        onComplete?.()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )
}
