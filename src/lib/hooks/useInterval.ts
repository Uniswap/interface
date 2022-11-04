import { useEffect, useRef } from 'react'

/**
 * Invokes callback repeatedly over an interval defined by the delay
 * @param callback
 * @param delay if null, the callback will not be invoked
 * @param leading if true, the callback will be invoked immediately (on the leading edge); otherwise, it will be invoked after delay
 */
export default function useInterval(callback: () => void | Promise<void>, delay: null | number, leading = true) {
  const savedCallback = useRef<typeof callback>()
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    async function tick() {
      if (savedCallback.current && delay !== null) {
        const promise = savedCallback.current()
        // Defer the next interval until the current callback has resolved.
        if (promise) await promise
        timeout.current = setTimeout(tick, delay)
      }
    }

    if (delay !== null) {
      if (leading) {
        tick()
      } else {
        timeout.current = setTimeout(tick, delay)
      }
    }
    return () => {
      timeout.current && clearInterval(timeout.current)
    }
  }, [delay, leading])
}
