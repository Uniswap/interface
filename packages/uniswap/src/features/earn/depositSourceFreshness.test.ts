import {
  getFreshPortfolioBalanceData,
  hasFreshEnoughPortfolioBalanceData,
} from 'uniswap/src/features/earn/depositSourceFreshness'

describe('deposit source freshness', () => {
  it('accepts any portfolio data when no minimum freshness timestamp is required', () => {
    expect(
      hasFreshEnoughPortfolioBalanceData({
        dataUpdatedAt: undefined,
        minimumBalanceDataUpdatedAtMs: undefined,
      }),
    ).toBe(true)
  })

  it('rejects portfolio data older than the required freshness timestamp', () => {
    expect(
      hasFreshEnoughPortfolioBalanceData({
        dataUpdatedAt: 999,
        minimumBalanceDataUpdatedAtMs: 1_000,
      }),
    ).toBe(false)
  })

  it('accepts portfolio data at or newer than the required freshness timestamp', () => {
    expect(
      hasFreshEnoughPortfolioBalanceData({
        dataUpdatedAt: 1_000,
        minimumBalanceDataUpdatedAtMs: 1_000,
      }),
    ).toBe(true)

    expect(
      hasFreshEnoughPortfolioBalanceData({
        dataUpdatedAt: 1_001,
        minimumBalanceDataUpdatedAtMs: 1_000,
      }),
    ).toBe(true)
  })

  it('hides portfolio data until it satisfies the required freshness timestamp', () => {
    const data = { balances: [] }

    expect(
      getFreshPortfolioBalanceData({
        data,
        dataUpdatedAt: 999,
        minimumBalanceDataUpdatedAtMs: 1_000,
      }),
    ).toBeUndefined()

    expect(
      getFreshPortfolioBalanceData({
        data,
        dataUpdatedAt: 1_000,
        minimumBalanceDataUpdatedAtMs: 1_000,
      }),
    ).toBe(data)
  })
})
