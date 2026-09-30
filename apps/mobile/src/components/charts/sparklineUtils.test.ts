import { findNearestIndex, getYForX, parseSvgPath } from 'src/components/charts/sparklineUtils'
import { computeChartPaths } from 'uniswap/src/components/charts/computeChartPaths'

describe('findNearestIndex', () => {
  it('returns 0 for normalizedX at the start', () => {
    const timestamps = { minT: 100, rangeT: 900, values: [100, 400, 700, 1000] }
    expect(findNearestIndex({ timestamps, normalizedX: 0 })).toBe(0)
  })

  it('returns last index for normalizedX at the end', () => {
    const timestamps = { minT: 100, rangeT: 900, values: [100, 400, 700, 1000] }
    expect(findNearestIndex({ timestamps, normalizedX: 1 })).toBe(3)
  })

  it('handles evenly spaced timestamps', () => {
    const timestamps = { minT: 0, rangeT: 300, values: [0, 100, 200, 300] }
    // normalizedX 0.5 → timestamp 150, nearest is index 1 (100) or 2 (200)
    const result = findNearestIndex({ timestamps, normalizedX: 0.5 })
    expect(result).toBe(1) // 150 is closer to 100 than 200? No: |150-100|=50, |150-200|=50 → tie goes to first found
  })

  it('correctly handles unevenly spaced timestamps — the original bug', () => {
    // Data clustered at the start: timestamps 0, 10, 20, 30, then a big gap to 1000
    const timestamps = { minT: 0, rangeT: 1000, values: [0, 10, 20, 30, 1000] }

    // Scrubbing at 50% of the chart width → timestamp 500
    // Linear mapping would give index Math.round(0.5 * 4) = 2 (timestamp 20) — WRONG
    // Timestamp mapping should give index 4 (timestamp 1000) since 500 is closest to 1000
    // |500-0|=500, |500-10|=490, |500-20|=480, |500-30|=470, |500-1000|=500
    // Actually closest is index 3 (timestamp 30) with distance 470
    expect(findNearestIndex({ timestamps, normalizedX: 0.5 })).toBe(3)
  })

  it('handles data clustered at the end', () => {
    // Big gap then clustered: 0, then 970, 980, 990, 1000
    const timestamps = { minT: 0, rangeT: 1000, values: [0, 970, 980, 990, 1000] }

    // Scrubbing at 10% → timestamp 100
    // Linear mapping would give index Math.round(0.1 * 4) = 0 — happens to be correct here
    // But at 50% → timestamp 500, linear gives index 2 (timestamp 980) — WRONG
    // Correct: closest to 500 is index 0 (timestamp 0, dist 500) or index 1 (timestamp 970, dist 470)
    expect(findNearestIndex({ timestamps, normalizedX: 0.5 })).toBe(1)
  })

  it('handles single-element values array', () => {
    const timestamps = { minT: 100, rangeT: 1, values: [100] }
    expect(findNearestIndex({ timestamps, normalizedX: 0.5 })).toBe(0)
  })

  it('handles two-element values array at midpoint', () => {
    const timestamps = { minT: 0, rangeT: 100, values: [0, 100] }
    // normalizedX 0.3 → timestamp 30, closer to 0 than 100
    expect(findNearestIndex({ timestamps, normalizedX: 0.3 })).toBe(0)
    // normalizedX 0.7 → timestamp 70, closer to 100 than 0
    expect(findNearestIndex({ timestamps, normalizedX: 0.7 })).toBe(1)
  })

  it('keeps the first duplicate on exact matches, ties, and out-of-range positions', () => {
    const timestamps = { minT: 0, rangeT: 100, values: [0, 0, 50, 50, 100, 100] }
    expect(findNearestIndex({ timestamps, normalizedX: -1 })).toBe(0)
    expect(findNearestIndex({ timestamps, normalizedX: 0.5 })).toBe(2)
    expect(findNearestIndex({ timestamps, normalizedX: 0.75 })).toBe(2)
    expect(findNearestIndex({ timestamps, normalizedX: 2 })).toBe(4)
  })

  it('matches a full-resolution nearest-point search across an uneven history', () => {
    const values = Array.from({ length: 1000 }, (_, index) => Math.floor(index / 3) ** 2)
    const timestamps = { minT: 0, rangeT: values[999]!, values }
    for (let step = 0; step <= 100; step++) {
      const normalizedX = step / 100
      const target = normalizedX * timestamps.rangeT
      const expected = values.reduce(
        (nearest, value, index) => (Math.abs(value - target) < Math.abs(values[nearest]! - target) ? index : nearest),
        0,
      )
      expect(findNearestIndex({ timestamps, normalizedX })).toBe(expected)
    }
  })

  it('does not scan a long history on each scrub movement', () => {
    const visitedIndices = new Set<string>()
    const values = new Proxy(
      Array.from({ length: 10_000 }, (_, index) => index),
      {
        get(target, property, receiver) {
          if (typeof property === 'string' && /^\d+$/.test(property)) {
            visitedIndices.add(property)
          }
          return Reflect.get(target, property, receiver)
        },
      },
    )
    expect(findNearestIndex({ timestamps: { minT: 0, rangeT: 9999, values }, normalizedX: 0.9 })).toBe(8999)
    // Count distinct candidates so repeated reads do not make this complexity guard brittle.
    expect(visitedIndices.size).toBeLessThan(50)
  })
})

describe('parseSvgPath', () => {
  it('parses M + C commands', () => {
    const segments = parseSvgPath('M0,10C0,10,48.333,29.333,50,30C51.667,30.667,100,50,100,50')
    expect(segments).toHaveLength(2)
    expect(segments[0]?.p0x).toBe(0)
    expect(segments[0]?.p0y).toBe(10)
    expect(segments[0]?.p3x).toBe(50)
    expect(segments[0]?.p3y).toBe(30)
    expect(segments[1]?.p0x).toBe(50)
    expect(segments[1]?.p3x).toBe(100)
  })

  it('parses M + L commands (2-point dataset from d3 curveCardinal)', () => {
    const segments = parseSvgPath('M0,10L100,50')
    expect(segments).toHaveLength(1)
    expect(segments[0]?.p0x).toBe(0)
    expect(segments[0]?.p0y).toBe(10)
    expect(segments[0]?.p3x).toBe(100)
    expect(segments[0]?.p3y).toBe(50)
    // Control points should be on the line at 1/3 and 2/3
    expect(segments[0]?.p1x).toBeCloseTo(100 / 3)
    expect(segments[0]?.p1y).toBeCloseTo(10 + 40 / 3)
  })

  it('returns empty array for empty path', () => {
    expect(parseSvgPath('')).toEqual([])
  })
})

describe('getYForX', () => {
  it('tracks retained extrema on a sampled cubic chart with uneven timestamps', () => {
    const data = [
      { timestamp: 0, value: 10 },
      { timestamp: 1, value: 12 },
      { timestamp: 10, value: 0 },
      { timestamp: 20, value: 30 },
      { timestamp: 21, value: 15 },
      { timestamp: 90, value: 25 },
      { timestamp: 91, value: 12 },
      { timestamp: 95, value: 5 },
      { timestamp: 96, value: 17 },
      { timestamp: 100, value: 10 },
    ]
    const { linePath } = computeChartPaths({ data, dataWidth: 200, height: 100, yGutter: 20, maxPoints: 6 })
    const segments = parseSvgPath(linePath!)
    expect(segments).toHaveLength(5)
    for (const index of [0, 2, 3, 5, 7, 9]) {
      const point = data[index]!
      expect(getYForX(segments, point.timestamp * 2)).toBeCloseTo(20 + ((30 - point.value) / 30) * 60)
    }
  })

  it('interpolates Y for a straight line promoted from L command', () => {
    const segments = parseSvgPath('M0,0L100,100')
    // Midpoint should be ~50
    const y = getYForX(segments, 50)
    expect(y).not.toBeNull()
    expect(y!).toBeCloseTo(50, 0)
  })

  it('returns null for x outside all segments', () => {
    const segments = parseSvgPath('M10,0L20,100')
    expect(getYForX(segments, 500)).toBeNull()
  })

  it('keeps the same segment at shared boundaries and within the endpoint tolerance', () => {
    const segments = parseSvgPath('M0,0L10,100L20,0')
    expect(getYForX(segments, -1)).toBeCloseTo(0)
    expect(getYForX(segments, 10)).toBeCloseTo(100)
    expect(getYForX(segments, 11)).toBeCloseTo(100)
    expect(getYForX(segments, 15)).toBeCloseTo(50)
    expect(getYForX(segments, 21)).toBeCloseTo(0)
    expect(getYForX(segments, -2)).toBeNull()
    expect(getYForX([], 0)).toBeNull()
  })

  it('does not scan every curve segment near the end of a long history', () => {
    const visitedIndices = new Set<string>()
    const path = `M0,0${Array.from({ length: 10_000 }, (_, index) => `L${index + 1},${index + 1}`).join('')}`
    const segments = new Proxy(parseSvgPath(path), {
      get(target, property, receiver) {
        if (typeof property === 'string' && /^\d+$/.test(property)) {
          visitedIndices.add(property)
        }
        return Reflect.get(target, property, receiver)
      },
    })
    expect(getYForX(segments, 9000)).toBeCloseTo(8999)
    expect(visitedIndices.size).toBeLessThan(50)
  })
})
