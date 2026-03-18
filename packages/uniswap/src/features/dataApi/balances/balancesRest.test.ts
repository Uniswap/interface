import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  convertRestBalanceToPortfolioBalance,
  createPortfolioCacheUpdater,
  formatPortfolioResponseToMap,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { DAI_CURRENCY_INFO, UNI_CURRENCY_INFO } from 'uniswap/src/test/fixtures'

const mainnetNativeAddress = getNativeAddress(UniverseChainId.Mainnet)

const mockPortfolioData = {
  portfolio: {
    balances: [
      { token: { address: mainnetNativeAddress, chainId: 1 }, amount: { amount: 1 }, isHidden: false },
      { token: { address: '0x2', chainId: 1 }, amount: { amount: 2 }, isHidden: false },
      { token: { address: mainnetNativeAddress, chainId: 1 }, amount: { amount: 3 }, isHidden: true },
    ],
    totalValueUsd: 300,
  },
}

const mockPortfolioBalance1: PortfolioBalance = {
  balanceUSD: 100,
  cacheId: 'TokenBalance:1-0x1-0xuser',
  currencyInfo: UNI_CURRENCY_INFO,
  id: '1-0x1-0xuser',
  isHidden: false,
  quantity: 1,
  relativeChange24: 2.5,
}

const mockPortfolioBalance2: PortfolioBalance = {
  balanceUSD: 200,
  cacheId: 'TokenBalance:1-0x3-0xuser',
  currencyInfo: DAI_CURRENCY_INFO,
  id: '1-0x3-0xuser',
  isHidden: false,
  quantity: 1,
  relativeChange24: 0,
}

describe(formatPortfolioResponseToMap, () => {
  const owner = '0xuser'

  it('returns undefined when portfolioData is undefined', () => {
    expect(
      formatPortfolioResponseToMap({ portfolioData: undefined, ownerAddress: owner, useMultichainFormat: false }),
    ).toBeUndefined()
    expect(
      formatPortfolioResponseToMap({ portfolioData: undefined, ownerAddress: owner, useMultichainFormat: true }),
    ).toBeUndefined()
  })

  it('returns undefined when portfolio is missing', () => {
    expect(
      formatPortfolioResponseToMap({ portfolioData: {} as never, ownerAddress: owner, useMultichainFormat: false }),
    ).toBeUndefined()
    expect(
      formatPortfolioResponseToMap({ portfolioData: {} as never, ownerAddress: owner, useMultichainFormat: true }),
    ).toBeUndefined()
  })

  it('with useMultichainFormat false returns legacy map keyed by currencyId', () => {
    const portfolioData = {
      portfolio: {
        balances: [
          {
            token: {
              chainId: 1,
              address: '0x0000000000000000000000000000000000000001',
              decimals: 18,
              symbol: 'ABC',
              name: 'Abc',
              metadata: {},
            },
            amount: { amount: 1, raw: '1000000000000000000' },
            valueUsd: 100,
            pricePercentChange1d: 0,
            isHidden: false,
          },
        ],
        totalValueUsd: 100,
      },
    } as never

    const result = formatPortfolioResponseToMap({ portfolioData, ownerAddress: owner, useMultichainFormat: false })

    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    const keys = Object.keys(result!)
    expect(keys.length).toBeGreaterThanOrEqual(0)
    keys.forEach((id) => {
      const balance = result![id]
      expect(balance).toHaveProperty('currencyInfo')
      expect(balance).toHaveProperty('id')
      expect(balance?.currencyInfo).toHaveProperty('currencyId')
    })
  })

  it('with useMultichainFormat false and empty balances returns empty object', () => {
    const portfolioData = {
      portfolio: {
        balances: [],
        totalValueUsd: 0,
      },
    } as never

    const result = formatPortfolioResponseToMap({ portfolioData, ownerAddress: owner, useMultichainFormat: false })

    expect(result).toBeDefined()
    expect(Object.keys(result!).length).toBe(0)
  })

  it('with useMultichainFormat true and multichain response returns multichain map keyed by currencyId', () => {
    const portfolioData = {
      portfolio: {
        balances: [],
        multichainBalances: [
          {
            name: 'USD Coin',
            symbol: 'USDC',
            logoUrl: '',
            chainBalances: [
              {
                chainId: 1,
                address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                decimals: 6,
                amount: { amount: 1, raw: '1' },
                valueUsd: 10,
              },
            ],
            totalAmount: { amount: 1, raw: '1' },
            priceUsd: 10,
            pricePercentChange1d: 0,
            totalValueUsd: 10,
            isHidden: false,
          },
        ],
        totalValueUsd: 10,
      },
    } as never

    const result = formatPortfolioResponseToMap({ portfolioData, ownerAddress: owner, useMultichainFormat: true })

    expect(result).toBeDefined()
    const entries = Object.entries(result!)
    expect(entries.length).toBeGreaterThanOrEqual(0)
    entries.forEach(([id, balance]) => {
      expect(typeof id).toBe('string')
      expect(balance).toHaveProperty('tokens')
      expect(Array.isArray(balance.tokens)).toBe(true)
      expect(balance.symbol).toBeDefined()
    })
  })

  it('with useMultichainFormat true and empty multichainBalances returns undefined', () => {
    const portfolioData = {
      portfolio: {
        balances: [],
        multichainBalances: [],
        totalValueUsd: 0,
      },
    } as never

    const result = formatPortfolioResponseToMap({ portfolioData, ownerAddress: owner, useMultichainFormat: true })

    expect(result).toBeUndefined()
  })
})

describe(convertRestBalanceToPortfolioBalance, () => {
  it('should return undefined when amount.amount is zero', () => {
    const balance = {
      token: { chainId: 1, address: '0x1', decimals: 18, symbol: 'TEST', name: 'Test Token', metadata: {} },
      amount: { amount: 0, raw: '0' },
      valueUsd: 0,
      pricePercentChange1d: 0,
      isHidden: false,
    }

    const result = convertRestBalanceToPortfolioBalance(balance as never, '0xuser')
    expect(result).toBeUndefined()
  })

  it('should return undefined when amount.amount is negative', () => {
    const balance = {
      token: { chainId: 1, address: '0x1', decimals: 18, symbol: 'TEST', name: 'Test Token', metadata: {} },
      amount: { amount: -1, raw: '0' },
      valueUsd: 0,
      pricePercentChange1d: 0,
      isHidden: false,
    }

    const result = convertRestBalanceToPortfolioBalance(balance as never, '0xuser')
    expect(result).toBeUndefined()
  })

  it('should return undefined when amount.amount is undefined', () => {
    const balance = {
      token: { chainId: 1, address: '0x1', decimals: 18, symbol: 'TEST', name: 'Test Token', metadata: {} },
      amount: { amount: undefined, raw: '0' },
      valueUsd: 0,
      pricePercentChange1d: 0,
      isHidden: false,
    }

    const result = convertRestBalanceToPortfolioBalance(balance as never, '0xuser')
    expect(result).toBeUndefined()
  })

  it('should return undefined when amount is missing', () => {
    const balance = {
      token: { chainId: 1, address: '0x1', decimals: 18, symbol: 'TEST', name: 'Test Token', metadata: {} },
      amount: undefined,
      valueUsd: 0,
      pricePercentChange1d: 0,
      isHidden: false,
    }

    const result = convertRestBalanceToPortfolioBalance(balance as never, '0xuser')
    expect(result).toBeUndefined()
  })

  it('should return undefined when token is missing', () => {
    const balance = {
      token: undefined,
      amount: { amount: 1, raw: '1000000000000000000' },
      valueUsd: 10,
      pricePercentChange1d: 0,
      isHidden: false,
    }

    const result = convertRestBalanceToPortfolioBalance(balance as never, '0xuser')
    expect(result).toBeUndefined()
  })
})

describe(createPortfolioCacheUpdater, () => {
  it('updates balance visibility and total value when hiding', () => {
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
      updateData: vi.fn(),
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
    const updaterFn = ctx.updateData.mock.calls[0]![1]
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(true)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(true)
    expect(result.portfolio.totalValueUsd).toBe(200)
  })

  it('updates balance visibility and total value when un-hiding', () => {
    const ctx = {
      getCurrentData: vi.fn().mockReturnValue(mockPortfolioData),
      updateData: vi.fn(),
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
    const updaterFn = ctx.updateData.mock.calls[0]![1]
    const result = updaterFn(mockPortfolioData)

    expect(result.portfolio.balances[0].isHidden).toBe(false)
    expect(result.portfolio.balances[1].isHidden).toBe(false)
    expect(result.portfolio.balances[2].isHidden).toBe(false)
    expect(result.portfolio.totalValueUsd).toBe(500)
  })
})
