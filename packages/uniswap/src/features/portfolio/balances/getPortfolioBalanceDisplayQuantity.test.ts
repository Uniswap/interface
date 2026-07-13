import { getPortfolioBalanceDisplayQuantity } from 'uniswap/src/features/portfolio/balances/getPortfolioBalanceDisplayQuantity'
import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'

describe(getPortfolioBalanceDisplayQuantity, () => {
  it('returns undefined when balance is undefined', () => {
    expect(getPortfolioBalanceDisplayQuantity(undefined)).toBeUndefined()
  })

  it('sums per-chain quantities when totalAmount is zero but tokens have balance', () => {
    const balance = createPortfolioMultichainBalance({
      totalAmount: 0,
      tokens: [
        createPortfolioChainBalance({ quantity: 100, valueUsd: 0 }),
        createPortfolioChainBalance({ chainId: 8453, quantity: 50, valueUsd: 0 }),
      ],
    })

    expect(getPortfolioBalanceDisplayQuantity(balance)).toBe(150)
  })

  it('uses totalAmount when token quantities sum to zero', () => {
    const balance = createPortfolioMultichainBalance({
      totalAmount: 42,
      tokens: [createPortfolioChainBalance({ quantity: 0 })],
    })

    expect(getPortfolioBalanceDisplayQuantity(balance)).toBe(42)
  })
})
