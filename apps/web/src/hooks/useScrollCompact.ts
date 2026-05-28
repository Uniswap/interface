import { useCallback, useRef, useSyncExternalStore } from 'react'
import { getScrollY, subscribe } from '~/state/scroll/scrollStore'

const DEFAULT_THRESHOLD_COMPACT = 120
const DEFAULT_THRESHOLD_EXPANDED = 60

interface applyThresholdsInput {
  prev: boolean
  y: number
  compact: number
  expanded: number
}

function applyThresholds({ prev, y, compact, expanded }: applyThresholdsInput): boolean {
  if (!prev && y > compact) {
    return true
  }
  if (prev && y < expanded) {
    return false
  }
  return prev
}

export function useScrollCompact({
  thresholdCompact = DEFAULT_THRESHOLD_COMPACT,
  thresholdExpanded = DEFAULT_THRESHOLD_EXPANDED,
}: {
  thresholdCompact?: number
  thresholdExpanded?: number
}): boolean {
  const compactRef = useRef(false)

  const subscribeToStore = useCallback(
    (onStoreChange: () => void) => {
      compactRef.current = applyThresholds({
        prev: compactRef.current,
        y: getScrollY(),
        compact: thresholdCompact,
        expanded: thresholdExpanded,
      })

      return subscribe(() => {
        const next = applyThresholds({
          prev: compactRef.current,
          y: getScrollY(),
          compact: thresholdCompact,
          expanded: thresholdExpanded,
        })
        if (next !== compactRef.current) {
          compactRef.current = next
          onStoreChange()
        }
      })
    },
    [thresholdCompact, thresholdExpanded],
  )

  const getSnapshot = useCallback(() => compactRef.current, [])

  return useSyncExternalStore(subscribeToStore, getSnapshot, () => false)
}
