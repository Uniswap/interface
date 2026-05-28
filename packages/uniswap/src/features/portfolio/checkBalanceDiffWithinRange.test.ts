import { checkBalanceDiffWithinRange } from 'uniswap/src/features/portfolio/checkBalanceDiffWithinRange'

describe('checkBalanceDiffWithinRange', () => {
  it('returns false when both values are undefined', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: undefined,
        portfolioTotalBalanceUSD: undefined,
      }),
    ).toBe(false)
  })

  it('returns false when chartTotalBalanceUSD is undefined', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: undefined,
        portfolioTotalBalanceUSD: 100,
      }),
    ).toBe(false)
  })

  it('returns false when portfolioTotalBalanceUSD is undefined', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 100,
        portfolioTotalBalanceUSD: undefined,
      }),
    ).toBe(false)
  })

  it('returns true when both are 0', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 0,
        portfolioTotalBalanceUSD: 0,
      }),
    ).toBe(true)
  })

  it('returns true when both are below $10 absolute floor even with >2% diff', () => {
    // $5 vs $3 = 40% diff, but both under $10 so treated as match
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 5,
        portfolioTotalBalanceUSD: 3,
      }),
    ).toBe(true)
  })

  it('returns true when values are within 2% threshold', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 1000,
        portfolioTotalBalanceUSD: 1010,
      }),
    ).toBe(true)
  })

  it('returns false when values exceed 2% threshold', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 1000,
        portfolioTotalBalanceUSD: 1050,
      }),
    ).toBe(false)
  })

  it('handles exactly 2% difference (uses strict less-than)', () => {
    // diff = 2, percentDiff = 2/102 * 100 ≈ 1.96% → within range
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 100,
        portfolioTotalBalanceUSD: 102,
      }),
    ).toBe(true)

    // diff = -2, percentDiff = -2/100 * 100 = -2%, abs = 2%, 2 < 2 is false
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 102,
        portfolioTotalBalanceUSD: 100,
      }),
    ).toBe(false)
  })

  it('handles chart=0 and portfolio>0 above floor', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 0,
        portfolioTotalBalanceUSD: 100,
      }),
    ).toBe(false)
  })

  it('handles portfolio=0 and chart>0 above floor', () => {
    expect(
      checkBalanceDiffWithinRange({
        chartTotalBalanceUSD: 100,
        portfolioTotalBalanceUSD: 0,
      }),
    ).toBe(false)
  })
})
