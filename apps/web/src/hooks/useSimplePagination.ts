import { useCallback, useReducer } from 'react'

/**
 * A custom hook that provides simple infrastructure for tracking pagination.
 *
 * @returns {Object} An object containing the current page number and a function to load more pages.
 * @returns {number} page - The current page number starting at 1.
 * @returns {Function} loadMore - A function to increment the page number. Accepts an optional onComplete callback.
 */
const useSimplePagination = () => {
  const [page, incrementPage] = useReducer((current: number) => current + 1, 1)

  const loadMore = useCallback(({ onComplete }: { onComplete?: () => void }) => {
    incrementPage()
    onComplete?.()
  }, [])

  return { page, loadMore }
}

export default useSimplePagination
