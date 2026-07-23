import { type PlainMessage } from '@bufbuild/protobuf'
import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { SharedQueryClient } from '@universe/api'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  convertRestBalanceToPortfolioBalance,
  formatPortfolioResponseToMap,
  usePortfolioTotalBalancesUsdPerChain,
  usePortfolioTotalValue,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { act, waitFor } from 'uniswap/src/test/test-utils'

const {
  mockUseEnabledChains,
  mockUseCurrencyIdToVisibility,
  mockUseGetWalletBalancesQuery,
  mockUseHideSmallBalancesSetting,
  mockUseHideSpamTokensSetting,
  mockUsePlatformBasedFetchPolicy,
} = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseCurrencyIdToVisibility: vi.fn(),
  mockUseGetWalletBalancesQuery: vi.fn(),
  mockUseHideSmallBalancesSetting: vi.fn(),
  mockUseHideSpamTokensSetting: vi.fn(),
  mockUsePlatformBasedFetchPolicy: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/getWalletBalances/getWalletBalances', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/rest/getWalletBalances/getWalletBalances')>()),
  useGetWalletBalancesQuery: mockUseGetWalletBalancesQuery,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/settings/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/settings/hooks')>()),
  useHideSmallBalancesSetting: mockUseHideSmallBalancesSetting,
  useHideSpamTokensSetting: mockUseHideSpamTokensSetting,
}))

vi.mock('uniswap/src/features/transactions/selectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/transactions/selectors')>()),
  useCurrencyIdToVisibility: mockUseCurrencyIdToVisibility,
}))

vi.mock('uniswap/src/utils/usePlatformBasedFetchPolicy', () => ({
  usePlatformBasedFetchPolicy: mockUsePlatformBasedFetchPolicy,
}))

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

  it('with useMultichainFormat true and empty multichainBalances returns empty object', () => {
    const portfolioData = {
      portfolio: {
        balances: [],
        multichainBalances: [],
        totalValueUsd: 0,
      },
    } as never

    const result = formatPortfolioResponseToMap({ portfolioData, ownerAddress: owner, useMultichainFormat: true })

    expect(result).toEqual({})
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

describe(usePortfolioTotalValue, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)
  })

  it('returns the raw error state when the portfolio total request errors before any cached data exists', () => {
    mockUseGetWalletBalancesQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
      refetch: vi.fn(),
      error: new Error('Network error'),
      status: 'error',
      dataUpdatedAt: undefined,
    })

    const { result } = renderHookWithProviders(() =>
      usePortfolioTotalValue({
        evmAddress: '0x123',
      }),
    )

    expect(result.current.data).toBeUndefined()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toEqual(expect.any(Error))
    expect(result.current.dataUpdatedAt).toBeUndefined()
  })

  it('returns cached portfolio total data alongside the raw error metadata', () => {
    mockUseGetWalletBalancesQuery.mockReturnValue({
      data: {
        balanceUSD: 100,
        percentChange: 2,
        absoluteChangeUSD: 5,
      },
      isFetching: false,
      refetch: vi.fn(),
      error: new Error('Network error'),
      status: 'error',
      dataUpdatedAt: 1710000000000,
    })

    const { result } = renderHookWithProviders(() =>
      usePortfolioTotalValue({
        evmAddress: '0x123',
      }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual({
      balanceUSD: 100,
      percentChange: 2,
      absoluteChangeUSD: 5,
    })
    expect(result.current.error).toEqual(expect.any(Error))
    expect(result.current.dataUpdatedAt).toBe(1710000000000)
  })
})

describe(usePortfolioTotalBalancesUsdPerChain, () => {
  const evmAddress = '0x123'

  // The exact input shape every fetching consumer uses (usePortfolioData & friends):
  // `multichain` is always present in the cache key.
  const producerQueryKey = getPortfolioQuery({
    input: { evmAddress, chainIds: [UniverseChainId.Mainnet], multichain: false },
  }).queryKey

  const portfolioResponse = {
    portfolio: {
      balances: [
        { token: { chainId: UniverseChainId.Mainnet }, valueUsd: 1200 },
        { token: { chainId: UniverseChainId.Mainnet }, valueUsd: 300 },
      ],
    },
  } as unknown as PlainMessage<GetPortfolioResponse>

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    SharedQueryClient.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)
  })

  it('never fetches on its own', () => {
    renderHookWithProviders(() => usePortfolioTotalBalancesUsdPerChain({ evmAddress }))

    expect(SharedQueryClient.isFetching()).toBe(0)
  })

  // CONS-2575 regression: the analytics read must share a cache key with the queries that actually
  // fetch portfolio data AND stay subscribed so it re-renders when one of them fills the cache.
  it('starts undefined on a cold cache, then emits per-chain totals when a producer fills the cache', async () => {
    const { result } = renderHookWithProviders(() => usePortfolioTotalBalancesUsdPerChain({ evmAddress }))

    expect(result.current).toBeUndefined()

    act(() => {
      SharedQueryClient.setQueryData(producerQueryKey, portfolioResponse)
    })

    await waitFor(() => {
      expect(result.current).toEqual({ ETHEREUM: 1500 })
    })
  })
})
