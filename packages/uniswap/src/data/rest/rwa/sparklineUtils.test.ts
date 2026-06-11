import { rwaSparklineToChartPoints } from 'uniswap/src/data/rest/rwa/sparklineUtils'

describe('rwaSparklineToChartPoints', () => {
  it('maps sparkline points for chart rendering', () => {
    const chartPoints = rwaSparklineToChartPoints({
      points: [
        { timestampS: 1_700_000_000, value: 245 },
        { timestampS: 1_700_003_600, value: 248.42 },
      ],
    })

    expect(chartPoints).toEqual([
      { timestamp: 1_700_000_000, value: 245 },
      { timestamp: 1_700_003_600, value: 248.42 },
    ])
  })

  it('returns an empty array when sparkline is missing', () => {
    expect(rwaSparklineToChartPoints(undefined)).toEqual([])
  })
})
