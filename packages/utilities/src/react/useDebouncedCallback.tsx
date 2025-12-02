import { useEffect, useRef, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * Hook to debounce callback execution, delaying execution until after the specified delay
 * has passed since the last time it was invoked
 *
 * @param callback The function to execute after debounce delay
 * @param debounceTimeMs Time in milliseconds to wait after last call before executing
 *
 * @returns [debouncedCallback, isDebouncing] - The debounced callback and a boolean indicating if execution is pending
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  debounceTimeMs = ONE_SECOND_MS,
): [(...args: Parameters<T>) => void, boolean] {
  const [isPending, setIsPending] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | number>(undefined)
  const argsRef = useRef<Parameters<T>>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = useEvent((...args: Parameters<T>) => {
    // Cancel any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Store the latest arguments
    argsRef.current = args
    setIsPending(true)

    // Set new timeout for delayed execution
    timeoutRef.current = setTimeout(async () => {
      try {
        await callback(...(argsRef.current as Parameters<T>))
      } catch (e) {
        logger.error(e, { tags: { file: 'useDebouncedCallback', function: 'debouncedCallback' } })
      } finally {
        setIsPending(false)
      }
    }, debounceTimeMs)
  })

  return [debouncedCallback, isPending]
}
