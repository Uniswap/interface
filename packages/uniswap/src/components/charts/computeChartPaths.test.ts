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
})
