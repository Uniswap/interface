import { NetworkStatus } from '@apollo/client'
import { renderHook } from '@testing-library/react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  sortPortfolioBalances,
  useSortedPortfolioBalances,
  useSortedPortfolioBalancesMultichain,
} from 'uniswap/src/features/dataApi/balances/balances'
import { usePortfolioData, usePortfolioDataMultichain } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { describe, expect, it, vi } from 'vitest'

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/dataApi/balances/balancesRest')>()
  return {
    ...actual,
    usePortfolioData: vi.fn(),
    usePortfolioDataMultichain: vi.fn(),
  }
})
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(() => ({ isTestnetModeEnabled: false })),
}))
vi.mock('uniswap/src/features/transactions/selectors', () => ({
  useCurrencyIdToVisibility: vi.fn(() => ({})),
}))

const mockUsePortfolioData = vi.mocked(usePortfolioData)
const mockUsePortfolioDataMultichain = vi.mocked(usePortfolioDataMultichain)

function createBalance(overrides: Partial<PortfolioBalance> = {}): PortfolioBalance {
  return {
    id: '1-0x1-0xuser',
    cacheId: 'TokenBalance:1-0x1-0xuser',
    currencyInfo: {
      currencyId: '1-0x1',
      currency: {
        chainId: 1,
        address: '0x1',
        isToken: true,
        symbol: 'A',
        name: 'A',
      } as PortfolioBalance['currencyInfo']['currency'],
      logoUrl: undefined,
    },
    quantity: 1,
    balanceUSD: 100,
    relativeChange24: 0,
    isHidden: false,
    ...overrides,
  } as PortfolioBalance
}

function createMultichainBalance(overrides: Partial<PortfolioMultichainBalance> = {}): PortfolioMultichainBalance {
  return {
    id: 'mc-1',
    cacheId: 'TokenBalance:mc-1-0xuser',
    name: 'USD Coin',
    symbol: 'USDC',
    logoUrl: null,
    totalAmount: 1,
    priceUsd: 10,
    pricePercentChange1d: null,
    totalValueUsd: 100,
    isHidden: false,
    tokens: [
      {
        chainId: 1,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        quantity: 1,
        valueUsd: 100,
        currencyInfo: {
          currencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          currency: {
            chainId: 1,
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            isToken: true,
          } as PortfolioMultichainBalance['tokens'][0]['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      },
    ],
    ...overrides,
  } as PortfolioMultichainBalance
}

describe(sortPortfolioBalances, () => {
  it('sorts balances by balanceUSD descending when not testnet mode', () => {
    const low = createBalance({
      id: 'low',
      balanceUSD: 10,
      currencyInfo: { currencyId: 'low', currency: { symbol: 'L' } as never, logoUrl: undefined },
    })
    const high = createBalance({
      id: 'high',
      balanceUSD: 1000,
      currencyInfo: { currencyId: 'high', currency: { symbol: 'H' } as never, logoUrl: undefined },
    })
    const mid = createBalance({
      id: 'mid',
      balanceUSD: 100,
      currencyInfo: { currencyId: 'mid', currency: { symbol: 'M' } as never, logoUrl: undefined },
    })

    const result = sortPortfolioBalances({
      balances: [low, high, mid],
      isTestnetModeEnabled: false,
    })

    expect(result[0]!.balanceUSD).toBe(1000)
    expect(result[1]!.balanceUSD).toBe(100)
    expect(result[2]!.balanceUSD).toBe(10)
  })

  it('returns empty array when balances is empty', () => {
    const result = sortPortfolioBalances({ balances: [], isTestnetModeEnabled: false })
    expect(result).toEqual([])
  })
})

describe(useSortedPortfolioBalances, () => {
  beforeEach(() => {
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: false } as ReturnType<typeof useEnabledChains>)
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({})
  })

  it('returns shape (balances and hiddenBalances arrays)', () => {
    const bal1 = createBalance({
      id: 'id1',
      currencyInfo: {
        currencyId: 'id1',
        currency: {
          chainId: 1,
          address: '0x1',
          isToken: true,
          symbol: 'A',
          name: 'A',
          isNative: false,
        },
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
    const map = { id1: bal1 }

    mockUsePortfolioData.mockReturnValue({
      data: map,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() => useSortedPortfolioBalances({ evmAddress: '0xuser' }))

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data?.balances)).toBe(true)
    expect(Array.isArray(result.current.data?.hiddenBalances)).toBe(true)
    result.current.data?.balances.forEach((b) => {
      expect(b).toHaveProperty('currencyInfo')
      expect(b).toHaveProperty('balanceUSD')
      expect(b).not.toHaveProperty('tokens')
    })
  })

  it('returns loading set to true when data is being fetched', () => {
    mockUsePortfolioData.mockReturnValue({
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() => useSortedPortfolioBalances({ evmAddress: '0xuser' }))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual({
      balances: [],
      hiddenBalances: [],
    })
  })

  it('returns empty balances when usePortfolioData returns undefined data', () => {
    mockUsePortfolioData.mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() => useSortedPortfolioBalances({ evmAddress: '0xuser' }))

    expect(result.current.data).toEqual({
      balances: [],
      hiddenBalances: [],
    })
  })
})

describe(useSortedPortfolioBalancesMultichain, () => {
  beforeEach(() => {
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: false } as ReturnType<typeof useEnabledChains>)
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({})
  })

  it('returns multichain shape (balances and hiddenBalances as multichain arrays)', () => {
    const mc1 = createMultichainBalance({ id: 'mc1' })
    const multichainMap = { '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': mc1 }

    mockUsePortfolioDataMultichain.mockReturnValue({
      data: multichainMap,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioDataMultichain>)

    const { result } = renderHook(() => useSortedPortfolioBalancesMultichain({ evmAddress: '0xuser' }))

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data?.balances)).toBe(true)
    expect(Array.isArray(result.current.data?.hiddenBalances)).toBe(true)
    result.current.data?.balances.forEach((b) => {
      expect(b).toHaveProperty('tokens')
      expect(b).toHaveProperty('totalValueUsd')
      expect(Array.isArray((b as PortfolioMultichainBalance).tokens)).toBe(true)
    })
  })

  it('handles malformed multichain data (missing tokens or name) without throwing', () => {
    const validBalance = createMultichainBalance({ id: 'valid' })
    const malformedBalance = {
      ...createMultichainBalance({ id: 'malformed' }),
      tokens: [],
      name: undefined,
    } as unknown as PortfolioMultichainBalance
    const multichainMap = {
      '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': validBalance,
      'malformed-id': malformedBalance,
    }

    mockUsePortfolioDataMultichain.mockReturnValue({
      data: multichainMap,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioDataMultichain>)

    const { result } = renderHook(() => useSortedPortfolioBalancesMultichain({ evmAddress: '0xuser' }))

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.balances).toBeDefined()
    expect(result.current.data?.hiddenBalances).toBeDefined()
  })
})
