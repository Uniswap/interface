import { createPortfolioCacheUpdater } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

const mockPortfolioData = {
  portfolio: {
    balances: [
      { token: { address: '0x1', chainId: 1 }, amount: { amount: 1 }, isHidden: false },
      { token: { address: '0x2', chainId: 1 }, amount: { amount: 2 }, isHidden: false },
      { token: { address: '0x3', chainId: 2 }, amount: { amount: 3 }, isHidden: true },
    ],
    totalValueUsd: 300,
  },
}

const mockCurrencyInfo1 = {
  currency: {
    symbol: 'UNI',
    chainId: 1,
    address: '0x1',
    isToken: true,
  },
} as CurrencyInfo

const mockPortfolioBalance1 = {
  balanceUSD: 100,
  cacheId: 'TokenBalance:1-0x1-0xuser',
  currencyInfo: mockCurrencyInfo1,
  id: '1-0x1-0xuser',
  isHidden: false,
  quantity: 1,
  relativeChange24: 2.5,
}

const mockCurrencyInfo2 = {
  currency: {
    symbol: 'USDC',
    chainId: 2,
    address: '0x3',
    isToken: true,
  },
} as CurrencyInfo

const mockPortfolioBalance2 = {
  balanceUSD: 200,
  cacheId: 'TokenBalance:1-0x3-0xuser',
  currencyInfo: mockCurrencyInfo2,
  id: '1-0x3-0xuser',
  isHidden: false,
  quantity: 1,
  relativeChange24: 0,
}

describe(createPortfolioCacheUpdater, () => {
  it('updates balance visibility and total value when hiding', () => {
    const ctx = {
      getCurrentData: jest.fn().mockReturnValue(mockPortfolioData),
      updateData: jest.fn(),
    }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    // Execute the update
    updater({ hidden: true, portfolioBalance: mockPortfolioBalance1 })

    // Verify the key was built correctly
    expect(ctx.getCurrentData).toHaveBeenCalledWith({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    // Test the updater function that was passed to setQueryData
    const updaterFn = ctx.updateData.mock.calls[0][1]
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(true)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(true)
    expect(result.portfolio.totalValueUsd).toBe(200)
  })

  it('updates balance visibility and total value when un-hiding', () => {
    const ctx = {
      getCurrentData: jest.fn().mockReturnValue(mockPortfolioData),
      updateData: jest.fn(),
    }

    const updater = createPortfolioCacheUpdater(ctx)({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    // Execute the update
    updater({ hidden: false, portfolioBalance: mockPortfolioBalance2 })

    // Verify the key was built correctly
    expect(ctx.getCurrentData).toHaveBeenCalledWith({
      evmAddress: '0xuser',
      chainIds: [1, 2],
    })

    // Test the updater function that was passed to setQueryData
    const updaterFn = ctx.updateData.mock.calls[0][1]
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(false)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(false)
    expect(result.portfolio.totalValueUsd).toBe(500)
  })
})
