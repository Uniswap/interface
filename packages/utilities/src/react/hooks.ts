import { useEffect, useMemo, useRef, useState } from 'react'

// modified from https://usehooks.com/usePrevious/
export function usePrevious<T>(value: T): T | undefined {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef<T>()

  // Store current value in ref
  useEffect(() => {
    ref.current = value
  }, [value]) // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current
}

// adapted from https://usehooks.com/useAsync/ but simplified
// above link contains example on how to add delayed execution if ever needed
export function useAsyncData<T>(
  asyncCallback: () => Promise<T> | undefined,
  cancel?: () => void
): {
  isLoading: boolean
  data: T | undefined
} {
  const [data, setData] = useState<{
    res: T | undefined
    input: () => Promise<T> | undefined
  }>({
    res: undefined,
    input: asyncCallback,
  })
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    let isCancelled = false

    async function runCallback(): Promise<void> {
      const res = await asyncCallback()
      // Prevent setting state if the component has unmounted (prevents memory leaks)
      if (!isMountedRef.current) return
      setIsLoading(false)
      // Prevent setting data if the request was cancelled
      if (isCancelled) return
      setData({
        res,
        input: asyncCallback,
      })
    }

    runCallback().catch(() => undefined)

    return () => {
      isCancelled = true
      cancel?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncCallback])

  return useMemo(() => {
    if (asyncCallback !== data.input) return { isLoading: true, data: undefined }

    return { isLoading, data: data.res }
  }, [asyncCallback, isLoading, data])
}

// modified from https://usehooks.com/useMemoCompare/
export function useMemoCompare<T>(next: () => T, compare: (a: T | undefined, b: T) => boolean): T {
  // Ref for storing previous value
  const previousRef = useRef<T>()
  const previous = previousRef.current
  const nextValue = next()

  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  const isEqual = compare(previous, nextValue)

  // If not equal update previousRef to next value.
  // We only update if not equal so that this hook continues to return
  // the same old value if compare keeps returning true.
  useEffect(() => {
    if (!isEqual) {
      previousRef.current = nextValue
    }
  })

  // Finally, if equal then return the previous value if it's set
  return isEqual && previous ? previous : nextValue
}
