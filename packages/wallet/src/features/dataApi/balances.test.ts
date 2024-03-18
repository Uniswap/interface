/* eslint-disable max-lines */
import { ApolloError, NetworkStatus } from '@apollo/client'
import { setupWalletCache } from 'uniswap/src/data/cache'
import {
  Chain,
  PortfolioBalanceDocument,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { FavoritesState, initialFavoritesState } from 'wallet/src/features/favorites/slice'
import { WalletState, initialWalletState } from 'wallet/src/features/wallet/slice'
import {
  ARBITRUM_CURRENCY,
  BASE_CURRENCY,
  MAINNET_CURRENCY,
  OPTIMISM_CURRENCY,
  POLYGON_CURRENCY,
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_CURRENCY_ID_2,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  currencyInfo,
  daiToken,
  ethToken,
  portfolio,
  portfolioBalance,
  tokenBalance,
} from 'wallet/src/test/fixtures'
import { act, createArray, renderHook, waitFor } from 'wallet/src/test/test-utils'
import { queryResolvers } from 'wallet/src/test/utils/resolvers'
import {
  sortPortfolioBalances,
  useHighestBalanceNativeCurrencyId,
  usePortfolioBalances,
  usePortfolioCacheUpdater,
  usePortfolioTotalValue,
  usePortfolioValueModifiers,
  useSortedPortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from './balances'

const daiTokenBalance = tokenBalance({ token: daiToken(), isHidden: true })
const ethTokenBalance = tokenBalance({ token: ethToken(), isHidden: false })
const daiPortfolioBalance = portfolioBalance({ fromBalance: daiTokenBalance })
const ethPortfolioBalance = portfolioBalance({ fromBalance: ethTokenBalance })
const Portfolio = portfolio({ tokenBalances: [daiTokenBalance, ethTokenBalance] })
const daiCurrencyId = daiPortfolioBalance.currencyInfo.currencyId
const ethCurrencyId = ethPortfolioBalance.currencyInfo.currencyId

const { resolvers: portfolioResolvers } = queryResolvers({
  portfolios: () => [Portfolio],
})

describe(usePortfolioValueModifiers, () => {
  const sharedModifier = {
    tokenIncludeOverrides: [],
    tokenExcludeOverrides: [],
    includeSmallBalances: false,
    includeSpamTokens: false,
  }

  const mockWalletState = (overrideSettings?: Partial<WalletState['settings']>): WalletState => ({
    ...initialWalletState,
    settings: {
      ...initialWalletState.settings,
      ...overrideSettings,
    },
  })

  const mockFavoritesState = (
    overrideTokensVisibility?: FavoritesState['tokensVisibility']
  ): FavoritesState => ({
    ...initialFavoritesState,
    tokensVisibility: {
      ...initialFavoritesState.tokensVisibility,
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
    const { result } = renderHook(() =>
      usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2])
    )

    expect(result.current).toEqual([
      { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1 },
      { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2 },
    ])
  })

  describe('includeSmallBalances', () => {
    it('returns modifiers with includeSmallBalances set to true if hideSmallBalances settings is false', () => {
      const { result } = renderHook(
        () => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]),
        { preloadedState: { wallet: mockWalletState({ hideSmallBalances: false }) } }
      )

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSmallBalances: true },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSmallBalances: true },
      ])
    })

    it('returns modifiers with includeSmallBalances set to false if hideSmallBalances settings is true', () => {
      const { result } = renderHook(
        () => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]),
        { preloadedState: { wallet: mockWalletState({ hideSmallBalances: true }) } }
      )

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSmallBalances: false },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSmallBalances: false },
      ])
    })
  })

  describe('includeSpamTokens', () => {
    it('returns modifiers with includeSpamTokens set to true if hideSpamTokens settings is false', () => {
      const { result } = renderHook(
        () => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]),
        { preloadedState: { wallet: mockWalletState({ hideSpamTokens: false }) } }
      )

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSpamTokens: true },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSpamTokens: true },
      ])
    })

    it('returns modifiers with includeSpamTokens set to false if hideSpamTokens settings is true', () => {
      const { result } = renderHook(
        () => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]),
        { preloadedState: { wallet: mockWalletState({ hideSpamTokens: true }) } }
      )

      expect(result.current).toEqual([
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_1, includeSpamTokens: false },
        { ...sharedModifier, ownerAddress: SAMPLE_SEED_ADDRESS_2, includeSpamTokens: false },
      ])
    })
  })

  describe('token overrides', () => {
    it('does not include token overrides in the result if tokensVisibility does not contain addresses visibility settings', () => {
      const { result } = renderHook(() => usePortfolioValueModifiers(SAMPLE_SEED_ADDRESS_1), {
        preloadedState: { favorites: mockFavoritesState() },
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

    it('includes token overrides in the result if tokensVisibility contains addresses visibility settings', () => {
      const { result } = renderHook(
        () => usePortfolioValueModifiers([SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2]),
        {
          preloadedState: {
            favorites: mockFavoritesState({
              [SAMPLE_SEED_ADDRESS_1]: {
                [SAMPLE_CURRENCY_ID_1]: { isVisible: false },
                [SAMPLE_CURRENCY_ID_2]: { isVisible: true },
              },
              [SAMPLE_SEED_ADDRESS_2]: {
                [SAMPLE_CURRENCY_ID_1]: { isVisible: true },
              },
            }),
          },
        }
      )

      expect(result.current).toEqual([
        {
          ...sharedModifier,
          ownerAddress: SAMPLE_SEED_ADDRESS_1,
          tokenIncludeOverrides: [
            {
              chain: Chain.Ethereum,
              address: SAMPLE_CURRENCY_ID_2.replace('1-', '').toLocaleLowerCase(),
            },
          ],
          tokenExcludeOverrides: [
            {
              chain: Chain.Ethereum,
              address: SAMPLE_CURRENCY_ID_1.replace('1-', '').toLocaleLowerCase(),
            },
          ],
        },
        {
          ...sharedModifier,
          ownerAddress: SAMPLE_SEED_ADDRESS_2,
          tokenIncludeOverrides: [
            {
              chain: Chain.Ethereum,
              address: SAMPLE_CURRENCY_ID_1.replace('1-', '').toLocaleLowerCase(),
            },
          ],
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
      networkStatus: NetworkStatus.ready,
      refetch: expect.any(Function),
      error: undefined,
    })
  })

  it('returns loading set to true when data is being fetched', async () => {
    const { result } = renderHook(() => usePortfolioBalances({ address: Portfolio.ownerAddress }), {
      resolvers: portfolioResolvers,
    })

    expect(result.current).toEqual({
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      refetch: expect.any(Function),
      error: undefined,
    })

    await act(() => undefined)
  })

  it('returns error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    const { resolvers } = queryResolvers({
      portfolios: () => {
        throw new Error('test')
      },
    })
    const { result } = renderHook(() => usePortfolioBalances({ address: Portfolio.ownerAddress }), {
      resolvers,
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        networkStatus: NetworkStatus.error,
        refetch: expect.any(Function),
        error: new ApolloError({ errorMessage: 'test' }),
      })
    })
  })

  it('returns undefined when no balances for the specified address are found', async () => {
    const { resolvers } = queryResolvers({
      portfolios: () => [],
    })
    const { result } = renderHook(() => usePortfolioBalances({ address: Portfolio.ownerAddress }), {
      resolvers,
    })

    expect(result.current.loading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        networkStatus: NetworkStatus.ready,
        refetch: expect.any(Function),
        error: undefined,
      })
    })
  })

  it('returns balances grouped by currencyId', async () => {
    const { result } = renderHook(() => usePortfolioBalances({ address: Portfolio.ownerAddress }), {
      resolvers: portfolioResolvers,
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        data: {
          [daiCurrencyId]: daiPortfolioBalance,
          [ethCurrencyId]: ethPortfolioBalance,
        },
        loading: false,
        networkStatus: NetworkStatus.ready,
        refetch: expect.any(Function),
        error: undefined,
      })
    })
  })

  it('calls onCompleted callback when query completes', async () => {
    const onCompleted = jest.fn()
    const { result } = renderHook(
      () => usePortfolioBalances({ address: daiCurrencyId, onCompleted }),
      { resolvers: portfolioResolvers }
    )

    expect(result.current.loading).toEqual(true)
    expect(onCompleted).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(result.current.loading).toEqual(false)
      expect(onCompleted).toHaveBeenCalledTimes(1)
    })
  })
})

describe(usePortfolioTotalValue, () => {
  it('returns empty results if no address was specified', () => {
    const { result } = renderHook(() => usePortfolioTotalValue({}))

    expect(result.current).toEqual({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: expect.any(Function),
      error: undefined,
    })
  })

  it('returns loading set to true when data is being fetched', async () => {
    const { result } = renderHook(
      () => usePortfolioTotalValue({ address: Portfolio.ownerAddress }),
      { resolvers: portfolioResolvers }
    )

    expect(result.current).toEqual({
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      refetch: expect.any(Function),
      error: undefined,
    })

    await act(() => undefined)
  })

  it('returns error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    const { resolvers } = queryResolvers({
      portfolios: () => {
        throw new Error('test')
      },
    })
    const { result } = renderHook(
      () => usePortfolioTotalValue({ address: Portfolio.ownerAddress }),
      { resolvers }
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        networkStatus: NetworkStatus.error,
        refetch: expect.any(Function),
        error: new ApolloError({ errorMessage: 'test' }),
      })
    })
  })

  it('retruns undefined when no balances for the specified address are found', async () => {
    const { resolvers } = queryResolvers({
      portfolios: () => [],
    })
    const { result } = renderHook(
      () => usePortfolioTotalValue({ address: Portfolio.ownerAddress }),
      { resolvers }
    )

    expect(result.current.loading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        networkStatus: NetworkStatus.ready,
        refetch: expect.any(Function),
        error: undefined,
      })
    })
  })

  it('returns total value of all balances for the specified address', async () => {
    const { result } = renderHook(
      () => usePortfolioTotalValue({ address: Portfolio.ownerAddress }),
      {
        resolvers: portfolioResolvers,
      }
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        data: {
          balanceUSD: Portfolio.tokensTotalDenominatedValue?.value,
          percentChange: Portfolio.tokensTotalDenominatedValueChange?.percentage?.value,
          absoluteChangeUSD: Portfolio.tokensTotalDenominatedValueChange?.absolute?.value,
        },
        loading: false,
        networkStatus: NetworkStatus.ready,
        refetch: expect.any(Function),
        error: undefined,
      })
    })
  })
})

describe(useHighestBalanceNativeCurrencyId, () => {
  it('returns undefined if there is no native currency', async () => {
    const { resolvers } = queryResolvers({
      portfolios: () => [portfolio({ tokenBalances: [daiTokenBalance] })],
    })
    const { result } = renderHook(() => useHighestBalanceNativeCurrencyId(SAMPLE_SEED_ADDRESS_1), {
      resolvers,
    })

    await act(() => undefined) // wait for query to complete

    expect(result.current).toEqual(undefined)
  })

  it('returns native currency id with the highest balance', async () => {
    const { result } = renderHook(() => useHighestBalanceNativeCurrencyId(SAMPLE_SEED_ADDRESS_1), {
      resolvers: portfolioResolvers,
    })

    await act(() => undefined) // wait for query to complete

    await waitFor(() => {
      expect(result.current).toEqual(ethCurrencyId) // ETH currency is native
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
      })
    )

    expect(result.current).toEqual({
      shownTokens: visibleBalances,
      hiddenTokens: hiddenBalances,
    })
  })
})

describe(useSortedPortfolioBalances, () => {
  it('returns loading set to true when data is being fetched', () => {
    const { result } = renderHook(() =>
      useSortedPortfolioBalances({ address: Portfolio.ownerAddress })
    )

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

  it('returns balances grouped by visibility when data is fetched', async () => {
    const { result } = renderHook(
      () => useSortedPortfolioBalances({ address: Portfolio.ownerAddress }),
      {
        resolvers: portfolioResolvers,
      }
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        data: {
          balances: [ethPortfolioBalance],
          hiddenBalances: [daiPortfolioBalance],
        },
        loading: false,
        networkStatus: NetworkStatus.ready,
        refetch: expect.any(Function),
      })
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

  it('returns balances with USD value before balances without USD value', () => {
    const result = sortPortfolioBalances([...balancesWithoutUSD, ...balancesWithUSD])

    expect(result).toEqual([
      ...createArray(balancesWithUSD.length, () =>
        expect.objectContaining({ balanceUSD: expect.any(Number) })
      ),
      ...createArray(balancesWithoutUSD.length, () =>
        expect.objectContaining({ balanceUSD: null })
      ),
    ])
  })

  it('sorts balances with USD value by USD value in descending order', () => {
    const result = sortPortfolioBalances(balancesWithUSD)

    expect(result).toEqual(balancesWithUSD.sort((a, b) => b.balanceUSD! - a.balanceUSD!))
  })

  it('sorts balances without USD value by name', () => {
    const result = sortPortfolioBalances(balancesWithoutUSD)

    expect(result).toEqual([
      balancesWithoutUSD[2],
      balancesWithoutUSD[1],
      balancesWithoutUSD[3],
      balancesWithoutUSD[4],
      balancesWithoutUSD[0],
    ])
  })
})

describe(usePortfolioCacheUpdater, () => {
  const cache = setupWalletCache()
  const modifyMock = jest.spyOn(cache, 'modify')
  const balance = portfolioBalance()

  beforeEach(async () => {
    await cache.reset()
    modifyMock.mockClear()

    cache.writeQuery({
      query: PortfolioBalanceDocument,
      data: { portfolios: [Portfolio] },
      variables: { owner: SAMPLE_SEED_ADDRESS_1 },
    })
  })

  it('updates the isHidden field in the cache', () => {
    const { result } = renderHook(() => usePortfolioCacheUpdater(SAMPLE_SEED_ADDRESS_1), {
      cache,
      resolvers: portfolioResolvers,
    })

    result.current(true, balance)

    expect(modifyMock).toHaveBeenCalledWith({
      id: balance.cacheId,
      fields: {
        isHidden: expect.any(Function),
      },
    })
  })

  it('updates the tokensTotalDenominatedValue field in the cache', () => {
    const { result } = renderHook(() => usePortfolioCacheUpdater(SAMPLE_SEED_ADDRESS_1), {
      cache,
      resolvers: portfolioResolvers,
    })

    result.current(true, balance)

    expect(modifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: {
          tokensTotalDenominatedValue: expect.any(Function),
        },
      })
    )
  })
})
