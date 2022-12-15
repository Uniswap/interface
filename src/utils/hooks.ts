import { useFocusEffect } from '@react-navigation/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PollingInterval } from 'src/constants/misc'

// modified from https://usehooks.com/usePrevious/
export function usePrevious<T>(value: T): T | undefined {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref: any = useRef<T>()

  // Store current value in ref
  useEffect(() => {
    ref.current = value
  }, [value]) // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current
}

// adapted from https://usehooks.com/useAsync/ but simplified
// above link contains example on how to add delayed execution if ever needed
export function useAsyncData<T>(asyncCallback: () => Promise<T> | undefined): {
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

  useEffect(() => {
    setIsLoading(true)

    async function runCallback(): Promise<void> {
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

export function usePollOnFocusOnly(
  startPolling: (interval: PollingInterval) => void,
  stopPolling: () => void,
  pollingInterval: PollingInterval
): void {
  useFocusEffect(
    useCallback(() => {
      startPolling(pollingInterval)
      return () => {
        stopPolling()
      }
    }, [startPolling, stopPolling, pollingInterval])
  )
}
