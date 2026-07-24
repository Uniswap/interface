import { ChartPeriod, GetPortfolioChartResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  PortfolioChartCategory,
  usePortfolioChartSeries,
} from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
import { renderHook } from '~/test-utils/render'

type Point = { timestamp: number; value: number }

function makeChartResponse(series: {
  points?: Point[]
  tokens?: Point[]
  pools?: Point[]
  earn?: Point[]
}): GetPortfolioChartResponse {
  const toPoints = (points: Point[] = []): Array<{ timestamp: bigint; value: number }> =>
    points.map((p) => ({ timestamp: BigInt(p.timestamp), value: p.value }))
  return {
    points: toPoints(series.points),
    tokens: toPoints(series.tokens),
    pools: toPoints(series.pools),
    earn: toPoints(series.earn),
  } as unknown as GetPortfolioChartResponse
}

describe('usePortfolioChartSeries', () => {
  it('returns empty series when chartData is undefined', () => {
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData: undefined,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.series).toEqual([])
    expect(result.current.chartPercentChange).toBeUndefined()
    expect(result.current.hasCategoryBreakdown).toBe(false)
  })

  it('returns empty series when chartData has no points', () => {
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData: makeChartResponse({ points: [] }),
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.series).toEqual([])
    expect(result.current.chartPercentChange).toBeUndefined()
  })

  it('transforms each point into a PriceChartData entry with matching open/high/low/close', () => {
    const chartData = makeChartResponse({
      points: [
        { timestamp: 1700000000, value: 100 },
        { timestamp: 1700003600, value: 110 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

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
    const chartData = makeChartResponse({
      points: [
        { timestamp: 1700000000, value: 100 },
        { timestamp: 1700003600, value: 110 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.chartPercentChange).toBeDefined()
    expect(result.current.chartPercentChange!.percentChange).toBeCloseTo(10, 5)
  })

  it('computes per-category percent change from the tokens and pools series', () => {
    const chartData = makeChartResponse({
      points: [
        { timestamp: 1700000000, value: 150 },
        { timestamp: 1700003600, value: 165 },
      ],
      tokens: [
        { timestamp: 1700000000, value: 100 },
        { timestamp: 1700003600, value: 110 },
      ],
      pools: [
        { timestamp: 1700000000, value: 50 },
        { timestamp: 1700003600, value: 45 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.tokensPercentChange).toBeCloseTo(10, 5)
    expect(result.current.poolsPercentChange).toBeCloseTo(-10, 5)
  })

  it('returns undefined per-category percent change for ChartPeriod.MAX', () => {
    const chartData = makeChartResponse({
      points: [
        { timestamp: 1700000000, value: 150 },
        { timestamp: 1700003600, value: 165 },
      ],
      tokens: [
        { timestamp: 1700000000, value: 100 },
        { timestamp: 1700003600, value: 110 },
      ],
      pools: [
        { timestamp: 1700000000, value: 50 },
        { timestamp: 1700003600, value: 45 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.MAX,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.tokensPercentChange).toBeUndefined()
    expect(result.current.poolsPercentChange).toBeUndefined()
  })

  it('returns undefined chartPercentChange for ChartPeriod.MAX even with valid data', () => {
    const chartData = makeChartResponse({
      points: [
        { timestamp: 1700000000, value: 100 },
        { timestamp: 1700003600, value: 110 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.MAX,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.series).toHaveLength(2)
    expect(result.current.chartPercentChange).toBeUndefined()
  })

  it('returns undefined chartPercentChange when only one point is present', () => {
    const chartData = makeChartResponse({ points: [{ timestamp: 1700000000, value: 100 }] })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.series).toHaveLength(1)
    expect(result.current.chartPercentChange).toBeUndefined()
  })

  it('exposes the tokens and pools series alongside the selected series', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 150 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
      pools: [{ timestamp: 1700000000, value: 50 }],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.tokensSeries[0].close).toBe(100)
    expect(result.current.poolsSeries[0].close).toBe(50)
  })

  it('returns the tokens series when Tokens is selected', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 150 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
      pools: [{ timestamp: 1700000000, value: 50 }],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Tokens,
      }),
    )

    expect(result.current.series[0].close).toBe(100)
  })

  it('returns the pools series when Pools is selected', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 150 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
      pools: [{ timestamp: 1700000000, value: 50 }],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Pools,
      }),
    )

    expect(result.current.series[0].close).toBe(50)
  })

  it('reports hasCategoryBreakdown when both tokens and pools have a non-zero value', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 150 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
      pools: [
        { timestamp: 1700000000, value: 0 },
        { timestamp: 1700003600, value: 50 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.hasCategoryBreakdown).toBe(true)
  })

  it('reports no breakdown when pools has data but tokens is missing', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 50 }],
      pools: [{ timestamp: 1700000000, value: 50 }],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.hasCategoryBreakdown).toBe(false)
  })

  it('reports no breakdown when tokens has data but pools is missing', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 100 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(result.current.hasCategoryBreakdown).toBe(false)
  })

  it('treats an all-zero pools or tokens series as no breakdown', () => {
    const allZeroPools = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 100 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
      pools: [{ timestamp: 1700000000, value: 0 }],
    })
    const allZeroTokens = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 50 }],
      tokens: [{ timestamp: 1700000000, value: 0 }],
      pools: [{ timestamp: 1700000000, value: 50 }],
    })

    const { result: poolsResult } = renderHook(() =>
      usePortfolioChartSeries({
        chartData: allZeroPools,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )
    const { result: tokensResult } = renderHook(() =>
      usePortfolioChartSeries({
        chartData: allZeroTokens,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Total,
      }),
    )

    expect(poolsResult.current.hasCategoryBreakdown).toBe(false)
    expect(tokensResult.current.hasCategoryBreakdown).toBe(false)
  })

  it('exposes the earn series and lists Earn in availableCategories when earn data is present', () => {
    const chartData = makeChartResponse({
      points: [{ timestamp: 1700000000, value: 150 }],
      tokens: [{ timestamp: 1700000000, value: 100 }],
      earn: [
        { timestamp: 1700000000, value: 40 },
        { timestamp: 1700003600, value: 44 },
      ],
    })
    const { result } = renderHook(() =>
      usePortfolioChartSeries({
        chartData,
        selectedPeriod: ChartPeriod.DAY,
        selectedCategory: PortfolioChartCategory.Earn,
      }),
    )

    expect(result.current.earnSeries[0].close).toBe(40)
    expect(result.current.earnPercentChange).toBeCloseTo(10, 5)
    expect(result.current.series[0].close).toBe(40)
    expect(result.current.availableCategories).toContain(PortfolioChartCategory.Earn)
    expect(result.current.availableCategories).toEqual([PortfolioChartCategory.Tokens, PortfolioChartCategory.Earn])
  })
})
