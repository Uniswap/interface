// ---------- SVG cubic Bézier path utilities (replaces react-native-redash) ----------

interface CubicSegment {
  p0x: number
  p0y: number
  p1x: number
  p1y: number
  p2x: number
  p2y: number
  p3x: number
  p3y: number
}

function parseCommandNums(cmd: string): number[] {
  return (
    cmd
      .slice(1)
      .match(/-?\d+\.?\d*/g)
      ?.map(Number) ?? []
  )
}

function parseLineSegments(nums: number[], cursor: { x: number; y: number }): CubicSegment[] {
  const segments: CubicSegment[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const endX = nums[i] ?? 0
    const endY = nums[i + 1] ?? 0
    // Promote to cubic Bézier with control points at 1/3 and 2/3 along the line
    segments.push({
      p0x: cursor.x,
      p0y: cursor.y,
      p1x: cursor.x + (endX - cursor.x) / 3,
      p1y: cursor.y + (endY - cursor.y) / 3,
      p2x: cursor.x + (2 * (endX - cursor.x)) / 3,
      p2y: cursor.y + (2 * (endY - cursor.y)) / 3,
      p3x: endX,
      p3y: endY,
    })
    cursor.x = endX
    cursor.y = endY
  }
  return segments
}

function parseCubicSegments(nums: number[], cursor: { x: number; y: number }): CubicSegment[] {
  const segments: CubicSegment[] = []
  for (let i = 0; i + 5 < nums.length; i += 6) {
    segments.push({
      p0x: cursor.x,
      p0y: cursor.y,
      p1x: nums[i] ?? 0,
      p1y: nums[i + 1] ?? 0,
      p2x: nums[i + 2] ?? 0,
      p2y: nums[i + 3] ?? 0,
      p3x: nums[i + 4] ?? 0,
      p3y: nums[i + 5] ?? 0,
    })
    cursor.x = nums[i + 4] ?? 0
    cursor.y = nums[i + 5] ?? 0
  }
  return segments
}

/**
 * Parses an SVG path string into cubic Bézier segments.
 * Handles M (moveTo), C (cubic Bézier), and L (lineTo) commands from d3 curveCardinal.
 * d3 emits L commands for 2-point datasets and C commands for 3+ points.
 */
export function parseSvgPath(d: string): CubicSegment[] {
  const commands = d.match(/[MLCZ][^MLCZ]*/gi)
  if (!commands) {
    return []
  }

  const segments: CubicSegment[] = []
  const cursor = { x: 0, y: 0 }

  for (const cmd of commands) {
    const type = cmd[0]?.toUpperCase()
    const nums = parseCommandNums(cmd)

    switch (type) {
      case 'M':
        cursor.x = nums[0] ?? 0
        cursor.y = nums[1] ?? 0
        break
      case 'L':
        segments.push(...parseLineSegments(nums, cursor))
        break
      case 'C':
        segments.push(...parseCubicSegments(nums, cursor))
        break
    }
  }

  return segments
}

const NEWTON_ITERATIONS = 8
const NEWTON_EPSILON = 1e-4

/** Evaluates a cubic Bézier at parameter t for one axis. p = [p0, p1, p2, p3]. */
function cubicBezier({ t, p }: { t: number; p: readonly [number, number, number, number] }): number {
  'worklet'
  const u = 1 - t
  return u * u * u * p[0] + 3 * u * u * t * p[1] + 3 * u * t * t * p[2] + t * t * t * p[3]
}

/** Derivative of cubic Bézier at parameter t for one axis. p = [p0, p1, p2, p3]. */
function cubicBezierDeriv({ t, p }: { t: number; p: readonly [number, number, number, number] }): number {
  'worklet'
  const u = 1 - t
  return 3 * u * u * (p[1] - p[0]) + 6 * u * t * (p[2] - p[1]) + 3 * t * t * (p[3] - p[2])
}

/**
 * Given parsed cubic Bézier segments and an x coordinate, returns the corresponding y value.
 * Requires segments in non-decreasing x order.
 * Uses Newton's method to solve for t where B_x(t) = x, then evaluates B_y(t).
 */
export function getYForX(segments: CubicSegment[], x: number): number | null {
  'worklet'
  // Chart segments are ordered by timestamp. Find the first candidate without
  // walking the entire history on every UI-thread gesture update.
  let low = 0
  let high = segments.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const segment = segments[mid]
    if (segment && segment.p3x + 1 < x) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  const seg = segments[low]
  if (seg) {
    const minX = Math.min(seg.p0x, seg.p3x)
    const maxX = Math.max(seg.p0x, seg.p3x)
    if (x < minX - 1 || x > maxX + 1) {
      return null
    }

    const px: [number, number, number, number] = [seg.p0x, seg.p1x, seg.p2x, seg.p3x]
    const py: [number, number, number, number] = [seg.p0y, seg.p1y, seg.p2y, seg.p3y]

    let t = (x - seg.p0x) / (seg.p3x - seg.p0x || 1)
    t = Math.max(0, Math.min(1, t))

    for (let j = 0; j < NEWTON_ITERATIONS; j++) {
      const dx = cubicBezier({ t, p: px }) - x
      if (Math.abs(dx) < NEWTON_EPSILON) {
        break
      }
      const dxdt = cubicBezierDeriv({ t, p: px })
      if (Math.abs(dxdt) < 1e-8) {
        break
      }
      t -= dx / dxdt
      t = Math.max(0, Math.min(1, t))
    }

    return cubicBezier({ t, p: py })
  }

  return null
}

/** Lower bound in the chart's chronologically ordered timestamps. */
function findFirstTimestampIndex(values: number[], timestamp: number): number {
  'worklet'
  let low = 0
  let high = values.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if ((values[mid] ?? 0) < timestamp) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

/**
 * Maps a normalized X position (0–1) to the nearest data point index
 * using chronologically ordered timestamps, correctly handling uneven time spacing.
 */
export function findNearestIndex({
  timestamps,
  normalizedX,
}: {
  timestamps: { minT: number; rangeT: number; values: number[] }
  normalizedX: number
}): number {
  'worklet'
  const scrubTimestamp = timestamps.minT + normalizedX * timestamps.rangeT
  const nextIndex = findFirstTimestampIndex(timestamps.values, scrubTimestamp)
  if (nextIndex === 0) {
    return 0
  }
  const previousTimestamp = timestamps.values[nextIndex - 1] ?? 0
  const nextTimestamp = timestamps.values[nextIndex]
  if (nextTimestamp !== undefined && nextTimestamp - scrubTimestamp < scrubTimestamp - previousTimestamp) {
    return nextIndex
  }
  // Preserve the earlier point on ties, including repeated timestamps.
  return findFirstTimestampIndex(timestamps.values, previousTimestamp)
}
