import { NetworkStatus } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  usePortfolioValueModifiers,
  useSortedPortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances/balances'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { initialUserSettingsState, UserSettingsState } from 'uniswap/src/features/settings/slice'
import { CurrencyIdToVisibility, initialVisibilityState, VisibilityState } from 'uniswap/src/features/visibility/slice'
import {
  ARBITRUM_CURRENCY,
  BASE_CURRENCY,
  currencyInfo,
  daiToken,
  ethToken,
  MAINNET_CURRENCY,
  OPTIMISM_CURRENCY,
  POLYGON_CURRENCY,
  portfolioBalance,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  tokenBalance,
} from 'uniswap/src/test/fixtures'
import { createArray } from 'uniswap/src/test/utils'
import { renderHook } from 'wallet/src/test/test-utils'

const daiTokenBalance = tokenBalance({ token: daiToken(), isHidden: true })
const ethTokenBalance = tokenBalance({ token: ethToken(), isHidden: false })
const daiPortfolioBalance = portfolioBalance({ fromBalance: daiTokenBalance })
const ethPortfolioBalance = portfolioBalance({ fromBalance: ethTokenBalance })

describe(usePortfolioValueModifiers, () => {
  const sharedModifier = {
    tokenIncludeOverrides: [],
    tokenExcludeOverrides: [],
    includeSmallBalances: false,
    includeSpamTokens: false,
  }

  const mockUserSettingsState = (overrideSettings?: Partial<UserSettingsState>): UserSettingsState => ({
    ...initialUserSettingsState,
    ...overrideSettings,
  })

  const mockVisibilityState = (overrideTokensVisibility?: CurrencyIdToVisibility): VisibilityState => ({
    ...initialVisibilityState,
    tokens: {
      ...initialVisibilityState.tokens,
      ...overrideTokensVisibility,
    },
  })

  it('returns undefined if no address is passed', () => {
    const { result } = renderHook(() => usePortfolioValueModifiers())

    expect(result.current).toEqual(undefined)
  })

  it('returns a single modifier if a single address is passed', () => {
    const { result } = renderHook(() => usePortfolioValueModifiers(SAMPLE_SEED_ADDRESS_1))

    expect(result.current).toEqual([{ ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1 }])
  })

  it('returns multiple modifiers if multiple addresses are passed', () => {
    const { result } = renderHook(() => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]))

    expect(result.current).toEqual([
      { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1 },
      { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2 },
    ])
  })

  describe('includeSmallBalances', () => {
    it('returns modifiers with includeSmallBalances set to true if hideSmallBalances settings is false', () => {
      const { result } = renderHook(() => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]), {
        preloadedState: { userSettings: mockUserSettingsState({ hideSmallBalances: false }) },
      })

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSmallBalances: true },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSmallBalances: true },
      ])
    })

    it('returns modifiers with includeSmallBalances set to false if hideSmallBalances settings is true', () => {
      const { result } = renderHook(() => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]), {
        preloadedState: { userSettings: mockUserSettingsState({ hideSmallBalances: true }) },
      })

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSmallBalances: false },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSmallBalances: false },
      ])
    })
  })

  describe('includeSpamTokens', () => {
    it('returns modifiers with includeSpamTokens set to true if hideSpamTokens settings is false', () => {
      const { result } = renderHook(() => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]), {
        preloadedState: { userSettings: mockUserSettingsState({ hideSpamTokens: false }) },
      })

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSpamTokens: true },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSpamTokens: true },
      ])
    })

    it('returns modifiers with includeSpamTokens set to false if hideSpamTokens settings is true', () => {
      const { result } = renderHook(() => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]), {
        preloadedState: { userSettings: mockUserSettingsState({ hideSpamTokens: true }) },
      })

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSpamTokens: false },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSpamTokens: false },
      ])
    })
  })

  describe('token overrides', () => {
    it('does not include token overrides in the result if tokensVisibility does not contain addresses visibility settings', () => {
      const { result } = renderHook(() => usePortfolioValueModifiers(SAMPLE_SEED_ADDRESS_1), {
        preloadedState: { visibility: mockVisibilityState() },
      })

      expect(result.current).toEqual([
        {
          ...sharedModifier,
          ownerAddress: SAMPLE_SEED_ADDRESS_1,
          tokenIncludeOverrides: [],
          tokenExcludeOverrides: [],
        },
      ])
    })
  })
})

describe(usePortfolioBalances, () => {
  it('returns empty results if no address was specified', () => {
    const { result } = renderHook(() => usePortfolioBalances({}))

    expect(result.current).toEqual({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.loading, // TanStack Query initial state
      refetch: expect.any(Function),
      error: undefined,
    })
  })
})

describe(usePortfolioTotalValue, () => {
  it('returns empty results if no address was specified', () => {
    const { result } = renderHook(() => usePortfolioTotalValue({}))

    expect(result.current).toEqual({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.loading, // TanStack Query initial state
      refetch: expect.any(Function),
      error: undefined,
    })
  })
})

describe(useTokenBalancesGroupedByVisibility, () => {
  const hiddenBalances = [daiPortfolioBalance]
  const visibleBalances = [ethPortfolioBalance]

  it('shownTokens and hiddenTokens are undefined when no balances are passed', () => {
    const { result } = renderHook(() => useTokenBalancesGroupedByVisibility({}))

    expect(result.current).toEqual({
      shownTokens: undefined,
      hiddenTokens: undefined,
    })
  })

  it('groups balances by visibility when balances are passed', () => {
    const { result } = renderHook(() =>
      useTokenBalancesGroupedByVisibility({
        balancesById: {
          [daiPortfolioBalance.cacheId]: daiPortfolioBalance,
          [ethPortfolioBalance.cacheId]: ethPortfolioBalance,
        },
      }),
    )

    expect(result.current).toEqual({
      shownTokens: visibleBalances,
      hiddenTokens: hiddenBalances,
    })
  })
})

describe(useSortedPortfolioBalances, () => {
  it('returns loading set to true when data is being fetched', () => {
    const { result } = renderHook(() => useSortedPortfolioBalances({ evmAddress: SAMPLE_SEED_ADDRESS_1 }))

    expect(result.current).toEqual({
      data: {
        balances: [],
        hiddenBalances: [],
      },
      loading: true,
      networkStatus: NetworkStatus.loading,
      refetch: expect.any(Function),
    })
  })
})

describe(sortPortfolioBalances, () => {
  const balancesWithUSD = createArray(3, portfolioBalance)
  const balancesWithoutUSD: ArrayOfLength<5, PortfolioBalance> = [
    portfolioBalance({
      balanceUSD: null,
      currencyInfo: currencyInfo({ currency: POLYGON_CURRENCY }),
    }),
    portfolioBalance({ balanceUSD: null, currencyInfo: currencyInfo({ currency: BASE_CURRENCY }) }),
    portfolioBalance({
      balanceUSD: null,
      currencyInfo: currencyInfo({ currency: ARBITRUM_CURRENCY }),
    }),
    portfolioBalance({
      balanceUSD: null,
      currencyInfo: currencyInfo({ currency: MAINNET_CURRENCY }),
    }),
    portfolioBalance({
      balanceUSD: null,
      currencyInfo: currencyInfo({ currency: OPTIMISM_CURRENCY }),
    }),
  ]
  const nativeBalances: ArrayOfLength<2, PortfolioBalance> = [
    portfolioBalance({
      balanceUSD: null,
      currencyInfo: currencyInfo({ currency: POLYGON_CURRENCY }),
      quantity: 200,
    }),
    portfolioBalance({
      balanceUSD: null,
      currencyInfo: currencyInfo({ currency: MAINNET_CURRENCY }),
      quantity: 100,
    }),
  ]
  const tokenBalances: ArrayOfLength<2, PortfolioBalance> = [
    {
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      cacheId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      quantity: 100,
      balanceUSD: null,
      relativeChange24: undefined,
      isHidden: undefined,
      currencyInfo: {
        logoUrl: '',
        currencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        currency: {
          isNative: false,
          isToken: true,
          name: 'USDT',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDT',
          decimals: 6,
          chainId: 1,
        } as Token,
      },
    },
    {
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      cacheId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      quantity: 100,
      balanceUSD: null,
      relativeChange24: undefined,
      isHidden: undefined,
      currencyInfo: {
        logoUrl: '',
        currencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        currency: {
          isNative: false,
          isToken: true,
          name: 'USDC',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          decimals: 6,
          chainId: 1,
        } as Token,
      },
    },
  ]

  it('[prod mode] returns balances with USD value before balances without USD value', () => {
    const result = sortPortfolioBalances({
      balances: [...balancesWithoutUSD, ...balancesWithUSD],
      isTestnetModeEnabled: false,
    })

    expect(result).toEqual([
      ...createArray(balancesWithUSD.length, () => expect.objectContaining({ balanceUSD: expect.any(Number) })),
      ...createArray(balancesWithoutUSD.length, () => expect.objectContaining({ balanceUSD: null })),
    ])
  })

  it('[prod mode] sorts balances with USD value by USD value in descending order', () => {
    const result = sortPortfolioBalances({ balances: balancesWithUSD, isTestnetModeEnabled: false })

    expect(result).toEqual(balancesWithUSD.sort((a, b) => b.balanceUSD! - a.balanceUSD!))
  })

  it('[prod mode] sorts balances without USD value by name', () => {
    const result = sortPortfolioBalances({ balances: balancesWithoutUSD, isTestnetModeEnabled: false })

    expect(result).toEqual([
      balancesWithoutUSD[2],
      balancesWithoutUSD[1],
      balancesWithoutUSD[3],
      balancesWithoutUSD[4],
      balancesWithoutUSD[0],
    ])
  })

  it('[testnet mode] returns native balances before everything else', () => {
    const result = sortPortfolioBalances({
      balances: [...tokenBalances, ...nativeBalances],
      isTestnetModeEnabled: true,
    })
    expect(result.map((t) => t.currencyInfo.currency.isNative)).toEqual([true, true, false, false])

    expect(result.map((t) => t.currencyInfo.currencyId)).toEqual(
      [nativeBalances[0], nativeBalances[1], tokenBalances[1], tokenBalances[0]].map((t) => t.currencyInfo.currencyId),
    )
  })

  it('[testnet mode] sorts native balances by balance in descending order', () => {
    const result = sortPortfolioBalances({ balances: nativeBalances, isTestnetModeEnabled: true })

    expect(result).toEqual(nativeBalances.sort((a, b) => b.quantity! - a.quantity!))
  })

  it('[testnet mode] sorts token balances by name', () => {
    const result = sortPortfolioBalances({ balances: tokenBalances, isTestnetModeEnabled: true })

    expect(result).toEqual([tokenBalances[1], tokenBalances[0]])
  })

  it('[testnet mode] sorts token balances by name (no name last)', () => {
    const namelessTokenBalance = {
      ...tokenBalances[1],
      currencyInfo: {
        ...tokenBalances[1].currencyInfo,
        currency: { ...tokenBalances[1].currencyInfo.currency, name: undefined },
      },
    }
    const result = sortPortfolioBalances({
      balances: [tokenBalances[0], namelessTokenBalance] as PortfolioBalance[],
      isTestnetModeEnabled: true,
    })

    expect(result).toEqual([tokenBalances[0], namelessTokenBalance])
  })
})
