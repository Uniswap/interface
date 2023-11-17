import { useEffect } from 'react'

/**
 * Invokes callback repeatedly over an interval defined by the delay
 *
 * @param callback
 * @param delay if null, the callback will not be invoked
 * @param leading by default, the callback will be invoked immediately (on the leading edge);
 *                if false, the callback will not be invoked until a first delay
 */
export default function useInterval(callback: () => void | Promise<void>, delay: null | number, leading = true) {
  useEffect(() => {
    if (delay === null) {
      return
    }

    let timeout: ReturnType<typeof setTimeout>
    tick(delay, /* skip= */ !leading)
    return () => {
      if (timeout) {
        clearInterval(timeout)
      }
    }

    async function tick(delay: number, skip = false) {
      if (!skip) {
        const promise = callback()

        // Defer the next interval until the current callback has resolved.
        if (promise) await promise
      }

      timeout = setTimeout(() => tick(delay), delay)
    }
  }, [callback, delay, leading])
}
