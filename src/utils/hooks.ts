import { useEffect, useMemo, useRef, useState } from 'react'

// modified from https://usehooks.com/usePrevious/
export function usePrevious<T>(value: T) {
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
export function useAsyncData<T>(asyncCallback: () => Promise<T> | undefined) {
  const [data, setData] = useState<{
    res: T | undefined
    input: () => Promise<T> | undefined
  }>({
    res: undefined,
    input: asyncCallback,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)

    async function runCallback() {
      const res = await asyncCallback()
      setIsLoading(false)
      setData({
        res,
        input: asyncCallback,
      })
    }

    runCallback()
  }, [asyncCallback])

  return useMemo(() => {
    if (asyncCallback !== data.input) return { isLoading: true, data: undefined }

    return { isLoading, data: data.res }
  }, [asyncCallback, isLoading, data])
}
