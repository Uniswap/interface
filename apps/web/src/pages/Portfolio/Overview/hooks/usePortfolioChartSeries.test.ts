import { ChartPeriod, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { usePortfolioChartSeries } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
import { renderHook } from '~/test-utils/render'

function makeChartResponse(points: Array<{ timestamp: number; value: number }>): GetPortfolioChartResponse {
  return {
    points: points.map((p) => ({ timestamp: BigInt(p.timestamp), value: p.value })),
  } as unknown as GetPortfolioChartResponse
}

describe('usePortfolioChartSeries', () => {
  it('returns empty series when chartData is undefined', () => {
    const { result } = renderHook(() =>
      usePortfolioChartSeries({ chartData: undefined, selectedPeriod: ChartPeriod.DAY }),
    )

    expect(result.current.series).toEqual([])
    expect(result.current.chartPercentChange).toBeUndefined()
  })

  it('returns empty series when chartData has no points', () => {
    const { result } = renderHook(() =>
      usePortfolioChartSeries({ chartData: makeChartResponse([]), selectedPeriod: ChartPeriod.DAY }),
    )

    expect(result.current.series).toEqual([])
    expect(result.current.chartPercentChange).toBeUndefined()
  })

  it('transforms each point into a PriceChartData entry with matching open/high/low/close', () => {
    const chartData = makeChartResponse([
      { timestamp: 1700000000, value: 100 },
      { timestamp: 1700003600, value: 110 },
    ])
    const { result } = renderHook(() => usePortfolioChartSeries({ chartData, selectedPeriod: ChartPeriod.DAY }))

    expect(result.current.series).toHaveLength(2)
    expect(result.current.series[0]).toMatchObject({
      time: 1700000000,
      value: 100,
      open: 100,
      high: 100,
      low: 100,
      close: 100,
    })
    expect(result.current.series[1].close).toBe(110)
  })

  it('computes percent change for the day period', () => {
    const chartData = makeChartResponse([
      { timestamp: 1700000000, value: 100 },
      { timestamp: 1700003600, value: 110 },
    ])
    const { result } = renderHook(() => usePortfolioChartSeries({ chartData, selectedPeriod: ChartPeriod.DAY }))

    expect(result.current.chartPercentChange).toBeDefined()
    expect(result.current.chartPercentChange!.percentChange).toBeCloseTo(10, 5)
  })

  it('returns undefined chartPercentChange for ChartPeriod.MAX even with valid data', () => {
    const chartData = makeChartResponse([
      { timestamp: 1700000000, value: 100 },
      { timestamp: 1700003600, value: 110 },
    ])
    const { result } = renderHook(() => usePortfolioChartSeries({ chartData, selectedPeriod: ChartPeriod.MAX }))

    expect(result.current.series).toHaveLength(2)
    expect(result.current.chartPercentChange).toBeUndefined()
  })

  it('returns undefined chartPercentChange when only one point is present', () => {
    const chartData = makeChartResponse([{ timestamp: 1700000000, value: 100 }])
    const { result } = renderHook(() => usePortfolioChartSeries({ chartData, selectedPeriod: ChartPeriod.DAY }))

    expect(result.current.series).toHaveLength(1)
    expect(result.current.chartPercentChange).toBeUndefined()
  })
})
