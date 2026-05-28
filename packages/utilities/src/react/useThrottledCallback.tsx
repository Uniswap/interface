import { useEffect, useRef, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Hook to throttle button clicks and prevent multiple submissions
 *
 * @param callback The function to execute when button is clicked
 * @param throttleTimeMs Time in milliseconds to wait before allowing another click
 *
 * @returns [throttledCallback, isDebouncing] - The throttled callback and a boolean indicating if debouncing is active
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  throttleTimeMs = ONE_SECOND_MS,
): [(...args: Parameters<T>) => Promise<void>, boolean] {
  const isDebouncingRef = useRef(false)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | number>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const throttledCallback = useEvent(async (...args: Parameters<T>) => {
    if (isDebouncingRef.current) {
      return
    }

    isDebouncingRef.current = true
    setIsDebouncing(true)

    try {
      await callback(...args)
    } catch (e) {
      logger.error(e, { tags: { file: 'useThrottledCallback', function: 'throttledCallback' } })
    } finally {
      timeoutRef.current = setTimeout(() => {
        isDebouncingRef.current = false
        setIsDebouncing(false)
      }, throttleTimeMs)
    }
  })

  return [throttledCallback, isDebouncing]
}
