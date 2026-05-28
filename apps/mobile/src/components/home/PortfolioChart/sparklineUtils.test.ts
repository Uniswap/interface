import {
  computeChartPaths,
  findNearestIndex,
  getYForX,
  parseSvgPath,
} from 'src/components/home/PortfolioChart/sparklineUtils'

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
})

describe('computeChartPaths', () => {
  const makeData = (points: [number, number][]): { timestamp: number; value: number }[] =>
    points.map(([timestamp, value]) => ({ timestamp, value }))

  it('returns nulls for fewer than 2 data points', () => {
    const result = computeChartPaths({ data: [{ timestamp: 1, value: 10 }], dataWidth: 100, height: 50, yGutter: 0 })
    expect(result.linePath).toBeNull()
    expect(result.areaPath).toBeNull()
    expect(result.lastPoint).toBeNull()
    expect(result.timestamps).toBeNull()
  })

  it('returns nulls for empty data', () => {
    const result = computeChartPaths({ data: [], dataWidth: 100, height: 50, yGutter: 0 })
    expect(result.linePath).toBeNull()
  })

  it('generates valid SVG paths for valid data', () => {
    const data = makeData([
      [0, 10],
      [50, 20],
      [100, 15],
    ])
    const result = computeChartPaths({ data, dataWidth: 200, height: 100, yGutter: 0 })

    expect(result.linePath).toBeTruthy()
    expect(result.linePath).toMatch(/^M/) // SVG path starts with M (moveTo)
    expect(result.areaPath).toBeTruthy()
    expect(result.areaPath).toMatch(/^M/)
  })

  it('computes lastPoint at the correct scaled position', () => {
    const data = makeData([
      [0, 0],
      [100, 100],
    ])
    const result = computeChartPaths({ data, dataWidth: 200, height: 100, yGutter: 0 })

    // Last point timestamp=100 → scaleX = ((100-0)/100) * 200 = 200
    // Last point value=100 → scaleY = 0 + ((100-100)/100) * 100 = 0 (top of chart)
    expect(result.lastPoint).toEqual({ x: 200, y: 0 })
  })

  it('computes lastPoint with yGutter', () => {
    const data = makeData([
      [0, 0],
      [100, 100],
    ])
    const result = computeChartPaths({ data, dataWidth: 200, height: 100, yGutter: 10 })

    // scaleY = 10 + ((100-100)/100) * (100-20) = 10
    expect(result.lastPoint).toEqual({ x: 200, y: 10 })
  })

  it('returns timestamp metadata for scrub index mapping', () => {
    const data = makeData([
      [10, 1],
      [50, 2],
      [90, 3],
    ])
    const result = computeChartPaths({ data, dataWidth: 100, height: 50, yGutter: 0 })

    expect(result.timestamps).toEqual({
      minT: 10,
      rangeT: 80,
      values: [10, 50, 90],
    })
  })

  it('handles constant timestamps gracefully (rangeT defaults to 1)', () => {
    const data = makeData([
      [50, 10],
      [50, 20],
    ])
    const result = computeChartPaths({ data, dataWidth: 100, height: 50, yGutter: 0 })

    expect(result.timestamps?.rangeT).toBe(1)
    expect(result.linePath).toBeTruthy()
  })

  it('handles constant values gracefully (rangeV defaults to 1)', () => {
    const data = makeData([
      [0, 50],
      [100, 50],
    ])
    const result = computeChartPaths({ data, dataWidth: 100, height: 50, yGutter: 0 })

    expect(result.linePath).toBeTruthy()
    expect(result.lastPoint).toBeTruthy()
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
})
