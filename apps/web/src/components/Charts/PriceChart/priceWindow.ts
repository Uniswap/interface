import type { DraggableRange } from '~/components/Charts/rangeDrag'

/** The prices the chart's axis shows, bottom to top. */
export type PriceWindow = { min: number; max: number }

// The range fills a third of the chart, leaving room to see the price above and below it (the create flow's
// range chart leaves less: its range fills two thirds).
const RANGE_SHARE_OF_WINDOW = 1 / 3

// The chart ignores a window starting at 0, and prices can't go below it, so the floor is just above 0.
const MIN_WINDOW_FLOOR_SHARE = 1e-6

function clampWindow({ min, max }: PriceWindow): PriceWindow {
  return { min: Math.max(min, max * MIN_WINDOW_FLOOR_SHARE), max }
}

/** A window centred on the range with room around it; undefined for a range with an open edge. */
export function getRangeWindow({ lower, upper }: DraggableRange): PriceWindow | undefined {
  if (lower === undefined || upper === undefined || upper <= lower) {
    return undefined
  }
  const center = (lower + upper) / 2
  const halfSpan = (upper - lower) / RANGE_SHARE_OF_WINDOW / 2
  return clampWindow({ min: center - halfSpan, max: center + halfSpan })
}

/** The window zoomed about its centre: a factor above 1 zooms in, below 1 zooms out. */
export function zoomWindow({ min, max }: PriceWindow, factor: number): PriceWindow {
  const center = (min + max) / 2
  const halfSpan = (max - min) / 2 / factor
  return clampWindow({ min: center - halfSpan, max: center + halfSpan })
}
