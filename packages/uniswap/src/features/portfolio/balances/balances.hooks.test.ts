import { renderHook } from '@testing-library/react'
import { SpamCode } from '@universe/api'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioData, usePortfolioDataMultichain } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { buildPortfolioBalance } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import type {
  PortfolioBalance,
  PortfolioChainBalance,
  PortfolioMultichainBalance,
} from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import {
  useHighestBalanceNativeCurrencyId,
  usePortfolioBalances,
  usePortfolioBalancesMultichain,
  usePortfolioValueModifiers,
  useSortedPortfolioBalances,
  useSortedPortfolioBalancesMultichain,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/portfolio/balances/hooks'
import { partitionMultichainTokensByVisibility } from 'uniswap/src/features/portfolio/balances/portfolioBalanceVisibility'
import { sortPortfolioBalances } from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'
import { useHideSmallBalancesSetting, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { createPortfolioMultichainBalance } from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { currencyId } from 'uniswap/src/utils/currencyId'
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
vi.mock('uniswap/src/features/settings/hooks', () => ({
  useHideSmallBalancesSetting: vi.fn(() => false),
  useHideSpamTokensSetting: vi.fn(() => false),
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
        isHidden: false,
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

describe(partitionMultichainTokensByVisibility, () => {
  it('splits tokens by per-chain isHidden when not in testnet mode', () => {
    const base = createMultichainBalance().tokens[0]!
    const onMainnet = { ...base, chainId: 1, isHidden: false } as PortfolioChainBalance
    const onArb = {
      ...base,
      chainId: 42161,
      isHidden: true,
      currencyInfo: {
        ...base.currencyInfo,
        currencyId: '42161-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        currency: {
          ...base.currencyInfo.currency,
          chainId: 42161,
        },
      },
    } as PortfolioChainBalance
    const { visible, hidden } = partitionMultichainTokensByVisibility({
      chainTokens: [onMainnet, onArb],
      multichainIsHidden: false,
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(visible).toHaveLength(1)
    expect(visible[0]!.chainId).toBe(1)
    expect(hidden).toHaveLength(1)
    expect(hidden[0]!.chainId).toBe(42161)
  })

  it('treats nullish per-chain isHidden as inheriting multichainIsHidden (web/extension REST shape)', () => {
    const base = createMultichainBalance().tokens[0]!
    const chainWithNullHidden = { ...base, chainId: 1, isHidden: null } as PortfolioChainBalance
    const { visible, hidden } = partitionMultichainTokensByVisibility({
      chainTokens: [chainWithNullHidden],
      multichainIsHidden: true,
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(visible).toHaveLength(0)
    expect(hidden).toHaveLength(1)
  })

  it('treats undefined per-chain isHidden like null for multichain inheritance', () => {
    const base = createMultichainBalance().tokens[0]!
    const chainUndefinedHidden = { ...base, chainId: 1, isHidden: undefined } as PortfolioChainBalance
    const { visible, hidden } = partitionMultichainTokensByVisibility({
      chainTokens: [chainUndefinedHidden],
      multichainIsHidden: true,
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(visible).toHaveLength(0)
    expect(hidden).toHaveLength(1)
  })

  it('does not inherit multichainIsHidden when per-chain isHidden is explicitly false', () => {
    const base = createMultichainBalance().tokens[0]!
    const chainExplicitVisible = { ...base, chainId: 1, isHidden: false } as PortfolioChainBalance
    const { visible, hidden } = partitionMultichainTokensByVisibility({
      chainTokens: [chainExplicitVisible],
      multichainIsHidden: true,
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(visible).toHaveLength(1)
    expect(hidden).toHaveLength(0)
  })

  it('keeps chain visible when multichain row is hidden but per-chain isHidden is nullish', () => {
    const base = createMultichainBalance().tokens[0]!
    const chainWithNullHidden = { ...base, chainId: 1, isHidden: null } as PortfolioChainBalance
    const { visible, hidden } = partitionMultichainTokensByVisibility({
      chainTokens: [chainWithNullHidden],
      multichainIsHidden: false,
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(visible).toHaveLength(1)
    expect(hidden).toHaveLength(0)
  })

  it('in testnet mode keeps all per-chain tokens visible regardless of isHidden and spamCode', () => {
    const base = createMultichainBalance().tokens[0]!
    const hiddenByApi = {
      ...base,
      chainId: 1,
      isHidden: true,
      currencyInfo: {
        ...base.currencyInfo,
        spamCode: SpamCode.HIGH,
      },
    } as PortfolioChainBalance
    const { visible, hidden } = partitionMultichainTokensByVisibility({
      chainTokens: [hiddenByApi],
      multichainIsHidden: true,
      isTestnetModeEnabled: true,
      currencyIdToTokenVisibility: {},
    })
    expect(visible).toHaveLength(1)
    expect(hidden).toHaveLength(0)
  })
})

describe(buildPortfolioBalance, () => {
  it('returns the same reference when called again with deep-equal args for the same cacheId', () => {
    const cacheId = 'buildPortfolioBalance:memo-test'
    const first = createBalance({ cacheId, id: 'a', balanceUSD: 1 })
    const a = buildPortfolioBalance(first)
    const b = buildPortfolioBalance({ ...first, balanceUSD: 1 })
    expect(b).toBe(a)
  })

  it('returns new object when data changes for the same cacheId', () => {
    const cacheId = 'buildPortfolioBalance:update-test'
    const first = buildPortfolioBalance(createBalance({ cacheId, balanceUSD: 1 }))
    const second = buildPortfolioBalance(createBalance({ cacheId, balanceUSD: 2 }))
    expect(second).not.toBe(first)
    expect(second.balanceUSD).toBe(2)
  })
})

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

  it('sorts zero-USD balances alphabetically by name after valued balances', () => {
    const zNoUsd = createBalance({
      id: 'z',
      balanceUSD: 0,
      currencyInfo: {
        currencyId: 'z',
        currency: { symbol: 'Z', name: 'Zed' } as never,
        logoUrl: undefined,
      },
    })
    const aNoUsd = createBalance({
      id: 'a',
      balanceUSD: undefined,
      currencyInfo: {
        currencyId: 'a',
        currency: { symbol: 'A', name: 'Alpha' } as never,
        logoUrl: undefined,
      },
    })
    const withUsd = createBalance({
      id: 'm',
      balanceUSD: 50,
      currencyInfo: {
        currencyId: 'm',
        currency: { symbol: 'M', name: 'Mid' } as never,
        logoUrl: undefined,
      },
    })
    const result = sortPortfolioBalances({
      balances: [zNoUsd, withUsd, aNoUsd],
      isTestnetModeEnabled: false,
    })
    expect(result[0]!.id).toBe('m')
    expect(result[1]!.id).toBe('a')
    expect(result[2]!.id).toBe('z')
  })

  it('sorts native by quantity then non-native by name in testnet mode', () => {
    const nativeSmall = createBalance({
      id: 'n1',
      quantity: 1,
      balanceUSD: 100,
      currencyInfo: {
        currencyId: 'n1',
        currency: {
          chainId: 1,
          address: '0x1',
          isToken: true,
          symbol: 'ETH',
          name: 'Ether',
          isNative: true,
        } as never,
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
    const nativeLarge = createBalance({
      id: 'n2',
      quantity: 50,
      balanceUSD: 1,
      currencyInfo: {
        currencyId: 'n2',
        currency: {
          chainId: 1,
          address: '0x2',
          isToken: true,
          symbol: 'ETH',
          name: 'Ether2',
          isNative: true,
        } as never,
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
    const token = createBalance({
      id: 't1',
      quantity: 999,
      balanceUSD: 0,
      currencyInfo: {
        currencyId: 't1',
        currency: {
          chainId: 1,
          address: '0xtoken',
          isToken: true,
          symbol: 'T',
          name: 'Token',
          isNative: false,
        } as never,
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
    const result = sortPortfolioBalances({
      balances: [token, nativeSmall, nativeLarge],
      isTestnetModeEnabled: true,
    })
    expect(result[0]!.quantity).toBe(50)
    expect(result[1]!.quantity).toBe(1)
    expect(result[2]!.currencyInfo.currency.isNative).toBe(false)
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
      isPending: false,
      isError: false,
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
      isPending: true,
      isError: false,
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
      isPending: false,
      isError: false,
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
    const mc1 = createPortfolioMultichainBalance({ id: 'mc1' })
    const multichainMap = { '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': mc1 }

    mockUsePortfolioDataMultichain.mockReturnValue({
      data: multichainMap,
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioDataMultichain>)

    const { result } = renderHook(() => useSortedPortfolioBalancesMultichain({ evmAddress: '0xuser' }))

    expect(result.current.data).toBeDefined()
    expect(result.current.balancesById).toBeDefined()
    expect(result.current.balancesById).toEqual(multichainMap)
    expect(Array.isArray(result.current.data?.balances)).toBe(true)
    expect(Array.isArray(result.current.data?.hiddenBalances)).toBe(true)
    result.current.data?.balances.forEach((b) => {
      expect(b).toHaveProperty('tokens')
      expect(b).toHaveProperty('totalValueUsd')
      expect(Array.isArray((b as PortfolioMultichainBalance).tokens)).toBe(true)
    })
  })

  it('passes through error and dataUpdatedAt from the multichain portfolio query', () => {
    const error = new Error('portfolio fetch failed')
    const dataUpdatedAt = 1710000000000

    mockUsePortfolioDataMultichain.mockReturnValue({
      data: undefined,
      loading: false,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
      error,
      dataUpdatedAt,
    } as ReturnType<typeof usePortfolioDataMultichain>)

    const { result } = renderHook(() => useSortedPortfolioBalancesMultichain({ evmAddress: '0xuser' }))

    expect(result.current.error).toBe(error)
    expect(result.current.dataUpdatedAt).toBe(dataUpdatedAt)
  })

  it('handles malformed multichain data (missing tokens or name) without throwing', () => {
    const validBalance = createPortfolioMultichainBalance({ id: 'valid' })
    const malformedBalance = {
      ...createPortfolioMultichainBalance({ id: 'malformed' }),
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
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioDataMultichain>)

    const { result } = renderHook(() => useSortedPortfolioBalancesMultichain({ evmAddress: '0xuser' }))

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.balances).toBeDefined()
    expect(result.current.data?.hiddenBalances).toBeDefined()
  })
})

describe(usePortfolioBalances, () => {
  it('forwards options to usePortfolioData and sets skip when no address is provided', () => {
    mockUsePortfolioData.mockReturnValue({
      data: undefined,
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    renderHook(() => usePortfolioBalances({ evmAddress: '0xabc123' }))
    expect(mockUsePortfolioData).toHaveBeenCalledWith(
      expect.objectContaining({
        evmAddress: '0xabc123',
        skip: false,
      }),
    )

    mockUsePortfolioData.mockClear()
    renderHook(() => usePortfolioBalances({ evmAddress: undefined, svmAddress: undefined }))
    expect(mockUsePortfolioData).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    )
  })

  it('respects explicit skip alongside address', () => {
    mockUsePortfolioData.mockReturnValue({
      data: undefined,
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    renderHook(() => usePortfolioBalances({ evmAddress: '0xabc', skip: true }))
    expect(mockUsePortfolioData).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
  })
})

describe(usePortfolioBalancesMultichain, () => {
  it('forwards requestMultichainFromBackend and skip to usePortfolioDataMultichain', () => {
    mockUsePortfolioDataMultichain.mockReturnValue({
      data: undefined,
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioDataMultichain>)

    renderHook(() =>
      usePortfolioBalancesMultichain({
        svmAddress: 'SoLAddr',
        requestMultichainFromBackend: true,
      }),
    )
    expect(mockUsePortfolioDataMultichain).toHaveBeenCalledWith(
      expect.objectContaining({
        svmAddress: 'SoLAddr',
        requestMultichainFromBackend: true,
        skip: false,
      }),
    )
  })
})

describe(useTokenBalancesGroupedByVisibility, () => {
  beforeEach(() => {
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: false } as ReturnType<typeof useEnabledChains>)
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({})
  })

  it('returns undefined lists when balancesById is undefined', () => {
    const { result } = renderHook(() => useTokenBalancesGroupedByVisibility({ balancesById: undefined }))
    expect(result.current.shownTokens).toBeUndefined()
    expect(result.current.hiddenTokens).toBeUndefined()
  })

  it('puts API-hidden non-native tokens in hiddenTokens when no manual visibility', () => {
    const shown = createBalance({ id: 'shown', isHidden: false })
    const hidden = createBalance({
      id: 'hidden',
      isHidden: true,
      currencyInfo: {
        ...createBalance().currencyInfo,
        currencyId: 'hidden-id',
        currency: {
          chainId: 1,
          address: '0xhidden',
          isToken: true,
          symbol: 'H',
          name: 'Hidden',
          isNative: false,
        } as PortfolioBalance['currencyInfo']['currency'],
      } as PortfolioBalance['currencyInfo'],
    })
    const { result } = renderHook(() =>
      useTokenBalancesGroupedByVisibility({
        balancesById: { shown, hidden },
      }),
    )
    expect(result.current.shownTokens?.map((b) => b.id)).toEqual(['shown'])
    expect(result.current.hiddenTokens?.map((b) => b.id)).toEqual(['hidden'])
  })

  describe('testnet mode', () => {
    beforeEach(() => {
      vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: true } as ReturnType<typeof useEnabledChains>)
    })

    it('keeps API-hidden balances in shownTokens', () => {
      const shown = createBalance({ id: 'shown', isHidden: false })
      const apiHidden = createBalance({
        id: 'apiHidden',
        isHidden: true,
        currencyInfo: {
          ...createBalance().currencyInfo,
          currencyId: 'hidden-id',
          spamCode: SpamCode.HIGH,
          currency: {
            chainId: 1,
            address: '0xhidden',
            isToken: true,
            symbol: 'H',
            name: 'Hidden',
            isNative: false,
          } as PortfolioBalance['currencyInfo']['currency'],
        } as PortfolioBalance['currencyInfo'],
      })
      const { result } = renderHook(() =>
        useTokenBalancesGroupedByVisibility({
          balancesById: { shown, apiHidden },
        }),
      )
      expect(result.current.shownTokens?.map((b) => b.id).sort()).toEqual(['apiHidden', 'shown'])
      expect(result.current.hiddenTokens).toBeUndefined()
    })
  })
})

describe(usePortfolioValueModifiers, () => {
  beforeEach(() => {
    vi.mocked(useHideSmallBalancesSetting).mockReturnValue(false)
    vi.mocked(useHideSpamTokensSetting).mockReturnValue(false)
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({})
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: false } as ReturnType<typeof useEnabledChains>)
  })

  it('returns undefined when no addresses are provided', () => {
    const { result } = renderHook(() => usePortfolioValueModifiers(undefined))
    expect(result.current).toBeUndefined()
  })

  it('maps visibility into include/exclude overrides and flips small/spam flags from settings', () => {
    const visibleCid = '1-0x0000000000000000000000000000000000000001'
    const hiddenCid = '1-0x0000000000000000000000000000000000000002'
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({
      [visibleCid]: { isVisible: true },
      [hiddenCid]: { isVisible: false },
    })
    vi.mocked(useHideSmallBalancesSetting).mockReturnValue(true)
    vi.mocked(useHideSpamTokensSetting).mockReturnValue(true)

    const { result } = renderHook(() => usePortfolioValueModifiers('0xOwner'))

    expect(result.current).toHaveLength(1)
    expect(result.current?.[0]).toMatchObject({
      ownerAddress: '0xOwner',
      includeSmallBalances: false,
      includeSpamTokens: false,
    })
    expect(result.current?.[0]?.tokenIncludeOverrides).toContainEqual(currencyIdToContractInput(visibleCid))
    expect(result.current?.[0]?.tokenExcludeOverrides).toContainEqual(currencyIdToContractInput(hiddenCid))
  })

  it('forces includeSpamTokens when testnet mode is enabled', () => {
    vi.mocked(useEnabledChains).mockReturnValue({ isTestnetModeEnabled: true } as ReturnType<typeof useEnabledChains>)
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({})
    vi.mocked(useHideSmallBalancesSetting).mockReturnValue(true)
    vi.mocked(useHideSpamTokensSetting).mockReturnValue(true)

    const { result } = renderHook(() => usePortfolioValueModifiers('0xOwner'))

    expect(result.current?.[0]).toMatchObject({
      ownerAddress: '0xOwner',
      includeSpamTokens: true,
    })
  })
})

describe(useHighestBalanceNativeCurrencyId, () => {
  beforeEach(() => {
    vi.mocked(useEnabledChains).mockReturnValue({
      isTestnetModeEnabled: false,
      defaultChainId: UniverseChainId.Mainnet,
      chains: [],
      gqlChains: [],
    } as ReturnType<typeof useEnabledChains>)
    vi.mocked(useCurrencyIdToVisibility).mockReturnValue({})
  })

  it('returns native currencyId from sorted balances when a native token is present', () => {
    const mainnetNativeId = currencyId(nativeOnChain(UniverseChainId.Mainnet))!
    const nativeBal = createBalance({
      id: 'native-row',
      cacheId: 'cache-native',
      balanceUSD: 1,
      currencyInfo: {
        currencyId: mainnetNativeId,
        currency: {
          chainId: UniverseChainId.Mainnet,
          address: '0x0000000000000000000000000000000000000000',
          isToken: false,
          symbol: 'ETH',
          name: 'Ether',
          isNative: true,
        } as never,
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
    mockUsePortfolioData.mockReturnValue({
      data: { [mainnetNativeId]: nativeBal },
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() =>
      useHighestBalanceNativeCurrencyId({ evmAddress: '0xuser', chainId: UniverseChainId.Mainnet }),
    )

    expect(result.current).toBe(mainnetNativeId)
  })

  it('falls back to default chain native currencyId when no native balance is in the list', () => {
    const erc20Only = createBalance({
      id: 'erc20',
      cacheId: 'cache-erc20',
      currencyInfo: {
        currencyId: '1-0xtokenonly',
        currency: {
          chainId: UniverseChainId.Mainnet,
          address: '0xtokenonly',
          isToken: true,
          symbol: 'TK',
          name: 'Token',
          isNative: false,
        } as PortfolioBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
    mockUsePortfolioData.mockReturnValue({
      data: { '1-0xtokenonly': erc20Only },
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() => useHighestBalanceNativeCurrencyId({ evmAddress: '0xuser' }))

    expect(result.current).toBe(currencyId(nativeOnChain(UniverseChainId.Mainnet)))
  })

  const createGasTokenBalance = (chainId: UniverseChainId, balanceUSD: number): PortfolioBalance => {
    const gasToken = getChainGasToken(chainId)
    return createBalance({
      id: `${chainId}-gas`,
      cacheId: `cache-${chainId}-gas`,
      balanceUSD,
      currencyInfo: {
        currencyId: currencyId(gasToken),
        currency: {
          chainId,
          address: gasToken.isNative ? undefined : gasToken.address,
          isToken: !gasToken.isNative,
          symbol: gasToken.symbol,
          name: gasToken.name,
          isNative: gasToken.isNative,
        } as PortfolioBalance['currencyInfo']['currency'],
        logoUrl: undefined,
      } as PortfolioBalance['currencyInfo'],
    })
  }

  it.each([
    { chain: UniverseChainId.Tempo, label: 'pathUSD on Tempo' },
    { chain: UniverseChainId.Arc, label: 'USDC on Arc' },
  ])('returns the gas token balance when wallet holds $label', ({ chain }) => {
    const gasTokenId = currencyId(getChainGasToken(chain))
    mockUsePortfolioData.mockReturnValue({
      data: { [gasTokenId]: createGasTokenBalance(chain, 100) },
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() => useHighestBalanceNativeCurrencyId({ evmAddress: '0xuser', chainId: chain }))

    expect(result.current).toBe(gasTokenId)
  })

  it('falls back to the requested chain gas token when portfolio has no balances', () => {
    mockUsePortfolioData.mockReturnValue({
      data: {},
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as ReturnType<typeof usePortfolioData>)

    const { result } = renderHook(() =>
      useHighestBalanceNativeCurrencyId({ evmAddress: '0xuser', chainId: UniverseChainId.Tempo }),
    )

    expect(result.current).toBe(currencyId(getChainGasToken(UniverseChainId.Tempo)))
  })
})
