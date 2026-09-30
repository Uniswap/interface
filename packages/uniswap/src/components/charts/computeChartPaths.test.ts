import { computeChartPaths } from 'uniswap/src/components/charts/computeChartPaths'

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

  it('preserves unsampled output when the data fits within the geometry budget', () => {
    const data = makeData([
      [0, 10],
      [50, 20],
      [100, 15],
    ])
    const options = { data, dataWidth: 200, height: 100, yGutter: 10 }

    expect(computeChartPaths({ ...options, maxPoints: 6 })).toEqual(computeChartPaths(options))
  })

  it('samples geometry by time bucket while retaining extrema, endpoints, and original scrub indices', () => {
    const data = makeData([
      [0, 10],
      [1, 12],
      [2, 0],
      [3, 30],
      [4, 15],
      [90, 25],
      [91, 12],
      [92, 5],
      [93, 17],
      [100, 10],
    ])
    const options = { dataWidth: 200, height: 100, yGutter: 10 }
    const result = computeChartPaths({ ...options, data, maxPoints: 6 })
    const expectedGeometry = computeChartPaths({
      ...options,
      data: makeData([
        [0, 10],
        [2, 0],
        [3, 30],
        [90, 25],
        [92, 5],
        [100, 10],
      ]),
    })
    const original = computeChartPaths({ ...options, data })

    expect(result.linePath).toBe(expectedGeometry.linePath)
    expect(result.areaPath).toBe(expectedGeometry.areaPath)
    expect(result.lastPoint).toEqual(original.lastPoint)
    expect(result.timestamps).toEqual(original.timestamps)
  })

  it.each([6, 7])('preserves scrub metadata for %i points at the sampling threshold', (length) => {
    const data = Array.from({ length }, (_, timestamp) => ({ timestamp, value: timestamp }))
    const options = { data, dataWidth: 300, height: 100, yGutter: 0 }
    const original = computeChartPaths(options)
    const result = computeChartPaths({ ...options, maxPoints: 6 })

    expect(result.linePath?.match(/[MCL]/g)).toHaveLength(6)
    expect(result.timestamps).toEqual(original.timestamps)
    expect(result.lastPoint).toEqual(original.lastPoint)
    if (length === 6) {
      expect(result).toEqual(original)
    }
  })

  it('bounds dense chart geometry independently of source history length', () => {
    const data = Array.from({ length: 10_000 }, (_, timestamp) => ({ timestamp, value: Math.sin(timestamp) }))
    const result = computeChartPaths({ data, dataWidth: 300, height: 100, yGutter: 0, maxPoints: 301 })

    // d3 creates one M command and one C/L segment per subsequent retained point.
    expect(result.linePath?.match(/[MCL]/g)?.length).toBeLessThanOrEqual(300)
    expect(result.timestamps?.values).toHaveLength(data.length)
    expect(result.lastPoint?.x).toBe(300)
  })

  it('retains both endpoints and extrema when given a budget below four points', () => {
    const data = makeData([
      [0, 10],
      [1, 12],
      [2, 0],
      [3, 30],
      [4, 15],
      [5, 10],
    ])
    const options = { dataWidth: 200, height: 100, yGutter: 0 }
    const result = computeChartPaths({ ...options, data, maxPoints: 2 })
    const expected = computeChartPaths({
      ...options,
      data: makeData([
        [0, 10],
        [2, 0],
        [3, 30],
        [5, 10],
      ]),
    })

    expect(result.linePath).toBe(expected.linePath)
    expect(result.areaPath).toBe(expected.areaPath)
  })

  it('handles constant timestamps and values without adding duplicate bucket extrema', () => {
    const data = Array.from({ length: 20 }, () => ({ timestamp: 50, value: 10 }))
    const result = computeChartPaths({ data, dataWidth: 200, height: 100, yGutter: 0, maxPoints: 4 })

    expect(result.linePath?.match(/[MCL]/g)).toHaveLength(3)
    expect(result.linePath).not.toMatch(/NaN|Infinity/)
    expect(result.timestamps).toEqual({ minT: 50, rangeT: 1, values: data.map((point) => point.timestamp) })
  })
})
