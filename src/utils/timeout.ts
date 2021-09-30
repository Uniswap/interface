import { useCallback, useEffect, useRef } from 'react'

export function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), milliseconds))
}

export async function promiseTimeout<T extends any>(promise: Promise<T>, milliseconds: number) {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise<null>((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id)
      resolve(null)
    }, milliseconds)
  })
  // Awaits the race, which will throw on timeout
  const result = await Promise.race([promise, timeout])
  return result
}

// https://usehooks-typescript.com/react-hook/use-interval
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void | null>()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  })

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      if (typeof savedCallback?.current !== 'undefined') {
        savedCallback?.current()
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }

    return undefined
  }, [delay])
}

// https://medium.com/javascript-in-plain-english/usetimeout-react-hook-3cc58b94af1f
export const useTimeout = (
  callback: () => void,
  delay = 0 // in ms (default: immediately put into JS Event Queue)
): (() => void) => {
  const timeoutIdRef = useRef<any>()

  const cancel = useCallback(() => {
    const timeoutId = timeoutIdRef.current
    if (timeoutId) {
      timeoutIdRef.current = undefined
      clearTimeout(timeoutId)
    }
  }, [timeoutIdRef])

  useEffect(() => {
    if (delay >= 0) {
      timeoutIdRef.current = setTimeout(callback, delay)
    }
    return cancel
  }, [callback, delay, cancel])

  return cancel
}
