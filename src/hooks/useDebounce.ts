import { useEffect, useState } from 'react'

/**
 * Debounces updates to a value.
 * Non-primitives *must* wrap the value in useMemo, or the value will be updated due to referential inequality.
 */
// modified from https://usehooks.com/useDebounce/
export default function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
