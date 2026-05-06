/**
 * Linear tick scale that maps ticks to pixel positions.
 * Used by both the vertical (range input) and horizontal (pool details) charts.
 */
export type LinearTickScale = {
  /** Convert a tick to pixel position (Y for vertical charts, X for horizontal) */
  tickToAxis: (tick: number) => number
  /** Convert pixel position to tick */
  axisToTick: (position: number) => number
  /** Min tick in the data range */
  minTick: number
  /** Max tick in the data range */
  maxTick: number
  /** Pixel range */
  range: [number, number]
}

/** Common renderer interface used by both vertical and horizontal charts */
export interface Renderer {
  draw(): void
}
