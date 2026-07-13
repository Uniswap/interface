import { useCallback, useMemo } from 'react'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { useRafCoalescedScrollWindow } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useRafCoalescedScrollWindow'
import type { ScrollWindowRange } from 'src/screens/HomeScreen/portfolio/types'

/** Off-viewport buffer (dp) above and below, wide enough that fast scrolls stay inside it. */
const DEFAULT_DRAW_DISTANCE = 1500

interface ScrollWindowParams {
  /** Outer FlatList scroll offset; used to derive which rows are within the visible window. */
  feedScrollValue: SharedValue<number>
  /** Outer FlatList viewport height, approximately device height. */
  viewportHeight: number
  /** Y-offset of the tab's first row inside the outer FlatList content. */
  bodyOffsetY: number
  /** Total number of windowed rows. */
  numRows: number
  /** Estimated row height used for the windowing math (and placeholder sizing at the call site). */
  rowHeight: number
  /** Off-viewport buffer (dp); defaults to {@link DEFAULT_DRAW_DISTANCE}. */
  drawDistance?: number
}

/**
 * Tracks which rows of a tab fall within the visible viewport (± a buffer) of the outer feed
 * FlatList so off-screen rows can render as fixed-height placeholders. Returns a predicate that
 * reports whether a given row index should render its real content.
 */
export function useScrollWindow({
  feedScrollValue,
  viewportHeight,
  bodyOffsetY,
  numRows,
  rowHeight,
  drawDistance = DEFAULT_DRAW_DISTANCE,
}: ScrollWindowParams): (index: number) => boolean {
  const safeRowHeight = Math.max(1, rowHeight)
  const firstWindowEnd = Math.max(
    0,
    Math.min(numRows - 1, Math.ceil((viewportHeight + drawDistance) / safeRowHeight) + 1),
  )
  const initialVisibleRange = useMemo((): ScrollWindowRange => ({ start: 0, end: firstWindowEnd }), [firstWindowEnd])
  const [visibleRange, scheduleVisibleRange] = useRafCoalescedScrollWindow(initialVisibleRange)

  useAnimatedReaction(
    () => {
      const scrollY = feedScrollValue.value
      const relStart = scrollY - bodyOffsetY - drawDistance
      const relEnd = scrollY - bodyOffsetY + viewportHeight + drawDistance
      const start = Math.max(0, Math.floor(relStart / safeRowHeight))
      const end = Math.max(0, Math.min(numRows - 1, Math.floor(relEnd / safeRowHeight)))
      return { start, end }
    },
    (range, prev) => {
      if (!prev || range.start !== prev.start || range.end !== prev.end) {
        runOnJS(scheduleVisibleRange)(range)
      }
    },
    [numRows, bodyOffsetY, viewportHeight, safeRowHeight, drawDistance, scheduleVisibleRange],
  )

  return useCallback(
    (index: number): boolean => index <= firstWindowEnd || (index >= visibleRange.start && index <= visibleRange.end),
    [firstWindowEnd, visibleRange.start, visibleRange.end],
  )
}
