import { useEffect, useRef } from 'react'

/**
 * Invokes callback repeatedly over an interval defined by the delay
 * @param callback
 * @param delay if null, the callback will not be invoked
 * @param leading if true, the callback will be invoked immediately (on the leading edge); otherwise, it will be invoked after delay
 */
export default function useInterval(callback: () => void, delay: null | number, leading = true) {
  const savedCallback = useRef<() => void>()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      const { current } = savedCallback
      current && current()
    }

    if (delay !== null) {
      if (leading) tick()
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
    return
  }, [delay, leading])
}
