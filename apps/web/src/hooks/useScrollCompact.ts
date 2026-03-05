import { useEffect, useState } from 'react'

interface UseScrollCompactOptions {
  scrollY?: number
  thresholdCompact?: number
  thresholdExpanded?: number
  enabled?: boolean
}

const DEFAULT_THRESHOLD_COMPACT = 120
const DEFAULT_THRESHOLD_EXPANDED = 60

/**
 * Returns whether the header/content should be in "compact" mode based on scroll position.
 * Uses hysteresis (different thresholds for compact vs expanded) to avoid flickering.
 * Shared by Portfolio header and Token Details header for scroll-to-shrink behavior.
 */
export function useScrollCompact({
  scrollY,
  thresholdCompact = DEFAULT_THRESHOLD_COMPACT,
  thresholdExpanded = DEFAULT_THRESHOLD_EXPANDED,
  enabled = true,
}: UseScrollCompactOptions): boolean {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    if (!enabled || scrollY === undefined) {
      setIsCompact(false)
      return
    }

    setIsCompact((prevIsCompact) => {
      if (!prevIsCompact && scrollY > thresholdCompact) {
        return true
      }
      if (prevIsCompact && scrollY < thresholdExpanded) {
        return false
      }
      return prevIsCompact
    })
  }, [enabled, scrollY, thresholdCompact, thresholdExpanded])

  return isCompact
}
