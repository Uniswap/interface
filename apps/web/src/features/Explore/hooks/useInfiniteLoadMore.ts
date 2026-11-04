import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook that provides a loadMore callback compatible with Table's infinite scroll.
 * onComplete fires on the isFetchingNextPage true→false transition — after React has
 * re-rendered with whatever the fetch produced — and must fire unconditionally: a page can
 * legitimately grow nothing (the backend returns a nextPageToken on its final page, an all
 * rows-filtered page, or an error) and withholding onComplete there leaves the Table's
 * loading indicator stuck forever. The Table's own no-growth budget handles not re-fetching
 * fruitlessly (see useTableLoadMore).
 */
export function useInfiniteLoadMore({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: {
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}): ({ onComplete }: { onComplete?: () => void }) => void {
  const onCompleteRef = useRef<(() => void) | undefined>(undefined)
  const prevWasFetchingRef = useRef<boolean>(false)

  useEffect(() => {
    if (onCompleteRef.current && !isFetchingNextPage && prevWasFetchingRef.current) {
      onCompleteRef.current()
      onCompleteRef.current = undefined
    }
    prevWasFetchingRef.current = isFetchingNextPage
  }, [isFetchingNextPage])

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
