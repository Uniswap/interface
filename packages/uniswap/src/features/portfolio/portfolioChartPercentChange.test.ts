import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'

describe('getPortfolioChartPercentChange', () => {
  it('returns undefined for empty array', () => {
    expect(getPortfolioChartPercentChange([])).toBeUndefined()
  })

  it('returns undefined for single data point', () => {
    expect(getPortfolioChartPercentChange([100])).toBeUndefined()
  })

  it('computes positive percent change', () => {
    const result = getPortfolioChartPercentChange([100, 110])
    expect(result).toBeDefined()
    expect(result!.percentChange).toBeCloseTo(10, 5)
    expect(result!.absoluteChangeUSD).toBeCloseTo(10, 5)
  })

  it('computes negative percent change', () => {
    const result = getPortfolioChartPercentChange([200, 150])
    expect(result).toBeDefined()
    expect(result!.percentChange).toBeCloseTo(-25, 5)
    expect(result!.absoluteChangeUSD).toBeCloseTo(-50, 5)
  })

  it('returns zero change when start equals end', () => {
    const result = getPortfolioChartPercentChange([100, 120, 100])
    expect(result).toBeDefined()
    expect(result!.percentChange).toBeCloseTo(0, 5)
    expect(result!.absoluteChangeUSD).toBeCloseTo(0, 5)
  })

  it('returns undefined when start value is zero', () => {
    expect(getPortfolioChartPercentChange([0, 100])).toBeUndefined()
  })

  it('uses first and last values only, ignoring intermediates', () => {
    const result = getPortfolioChartPercentChange([100, 500, 200])
    expect(result).toBeDefined()
    expect(result!.percentChange).toBeCloseTo(100, 5)
    expect(result!.absoluteChangeUSD).toBeCloseTo(100, 5)
  })

  it('handles very small values without floating point issues', () => {
    const result = getPortfolioChartPercentChange([0.001, 0.002])
    expect(result).toBeDefined()
    expect(result!.percentChange).toBeCloseTo(100, 5)
    expect(result!.absoluteChangeUSD).toBeCloseTo(0.001, 10)
  })
})
