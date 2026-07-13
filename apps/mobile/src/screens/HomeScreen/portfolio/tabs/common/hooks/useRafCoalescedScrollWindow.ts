import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrollWindowRange } from 'src/screens/HomeScreen/portfolio/types'

/**
 * Applies UI-thread window updates to React state without a backlog of stale ranges.
 * `runOnJS` can queue many updates while the JS thread is busy; this keeps only the
 * latest range and applies it on the next frame.
 */
export function useRafCoalescedScrollWindow(
  initialRange: ScrollWindowRange,
): [ScrollWindowRange, (range: ScrollWindowRange) => void] {
  const [visibleRange, setVisibleRange] = useState<ScrollWindowRange>(initialRange)
  const latestRef = useRef<ScrollWindowRange>(initialRange)
  const rafRef = useRef<number | null>(null)

  const flush = useCallback((): void => {
    rafRef.current = null
    setVisibleRange(latestRef.current)
  }, [])

  const scheduleRange = useCallback(
    (range: ScrollWindowRange): void => {
      latestRef.current = range
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = requestAnimationFrame(flush)
    },
    [flush],
  )

  useEffect(() => {
    return (): void => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return [visibleRange, scheduleRange]
}
