type BarRect = { x: number; y: number; width: number; height: number }

/**
 * Bars as one SVG path per distinct opacity, for full-granularity charts that draw hundreds to thousands of
 * bars a frame: a handful of path nodes instead of a rect each, and bars that abut inside one path rasterize
 * without seams, so the profile reads as a smooth shape. Bars `getRect` returns undefined for are skipped.
 */
export function buildBarPathsByOpacity<T>({
  bars,
  getOpacity,
  getRect,
}: {
  bars: readonly T[]
  getOpacity: (bar: T) => number
  getRect: (bar: T) => BarRect | undefined
}): { opacity: number; d: string }[] {
  const pathsByOpacity = new Map<number, string[]>()
  for (const bar of bars) {
    const rect = getRect(bar)
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      continue
    }
    const opacity = getOpacity(bar)
    const commands = pathsByOpacity.get(opacity) ?? []
    commands.push(
      `M${round(rect.x)},${round(rect.y)}h${round(rect.width)}v${round(rect.height)}h${round(-rect.width)}Z`,
    )
    pathsByOpacity.set(opacity, commands)
  }
  return Array.from(pathsByOpacity, ([opacity, commands]) => ({ opacity, d: commands.join('') }))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
