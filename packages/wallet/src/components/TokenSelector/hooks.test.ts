/* eslint-disable max-lines */
import { ApolloError } from '@apollo/client'
import { toIncludeSameMembers } from 'jest-extended'
import { PreloadedState } from 'redux'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { createEmptyBalanceOption } from 'wallet/src/components/TokenSelector/utils'
import { BRIDGED_BASE_ADDRESSES } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { tokenProjectToCurrencyInfos } from 'wallet/src/features/dataApi/utils'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { SharedState } from 'wallet/src/state/reducer'
import {
  SAMPLE_SEED_ADDRESS_1,
  arbitrumDaiCurrencyInfo,
  daiToken,
  ethCurrencyInfo,
  ethToken,
  portfolio,
  portfolioBalance,
  portfolioBalances,
  token,
  tokenBalance,
  tokenProject,
  usdcArbitrumToken,
  usdcBaseToken,
  usdcCurrencyInfo,
  usdcToken,
} from 'wallet/src/test/fixtures'
import { act, createArray, renderHook, waitFor } from 'wallet/src/test/test-utils'
import { portfolioBalancesById, queryResolvers } from 'wallet/src/test/utils'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'
import {
  useAllCommonBaseCurrencies,
  useCommonTokensOptions,
  useCurrencyInfosToTokenOptions,
  useFavoriteCurrencies,
  useFavoriteTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioBalancesForAddressById,
  usePortfolioTokenOptions,
} from './hooks'

expect.extend({ toIncludeSameMembers })

jest.mock('wallet/src/telemetry')

const eth = ethToken()
const dai = daiToken()
const usdc = usdcBaseToken()
const ethBalance = tokenBalance({ token: eth })
const daiBalance = tokenBalance({ token: dai })
const usdcBalance = tokenBalance({ token: usdc })
const favoriteTokens = [eth, dai, usdc]
const favoriteTokenBalances = [ethBalance, daiBalance, usdcBalance]

const favoriteCurrencyIds = favoriteTokens.map((t) =>
  buildCurrencyId(fromGraphQLChain(t.chain) ?? ChainId.Mainnet, t.address)
)

const preloadedState: PreloadedState<SharedState> = {
  favorites: {
    tokens: favoriteCurrencyIds,
    watchedAddresses: [],
    tokensVisibility: {},
    nftsData: {},
  },
}

const queryResolver =
  <T>(result: T | Error) =>
  (): T => {
    if (result instanceof Error) {
      throw result
    }
    return result as T
  }

describe(useAllCommonBaseCurrencies, () => {
  const projects = createArray(3, tokenProject)

  const nonBridgedTokens = [
    ethToken(),
    daiToken(),
    usdcToken(),
    usdcBaseToken(),
    usdcArbitrumToken(),
  ]
  const bridgedTokens = BRIDGED_BASE_ADDRESSES.map((address) =>
    token({ address, chain: Chain.Ethereum })
  )
  const projectWithBridged = tokenProject({ tokens: [...nonBridgedTokens, ...bridgedTokens] })
  const tokenProjectWithoutBridged = {
    ...projectWithBridged, // Copy all props except tokens (leave only non-bridged tokens)
    tokens: nonBridgedTokens,
  }

  const cases = [
    {
      test: 'returns undefined if there is no data',
      input: null,
      output: {},
    },
    {
      test: 'returns error when fetch fails',
      input: new Error('Test'),
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns all currencies when there is no currency with a bridged version on other networks',
      input: projects,
      output: { data: tokenProjectToCurrencyInfos(projects) },
    },
    {
      test: 'filters out currencies that have a bridged version on other networks',
      input: [projectWithBridged],
      output: { data: tokenProjectToCurrencyInfos([tokenProjectWithoutBridged]) },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      jest.spyOn(console, 'error').mockImplementation(jest.fn())
    }

    const { resolvers } = queryResolvers({
      tokenProjects: queryResolver(input),
    })
    const { result } = renderHook(() => useAllCommonBaseCurrencies(), {
      resolvers,
    })

    expect(result.current.loading).toEqual(true)

    await waitFor(async () => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(useFavoriteCurrencies, () => {
  const project = tokenProject({
    // Add some more tokens to check if favorite tokens are filtered properly
    tokens: [usdcArbitrumToken(), usdcBaseToken(), ...favoriteTokens, usdcToken()],
  })
  const projectWithFavoritesOnly = tokenProject({
    ...project,
    tokens: favoriteTokens,
  })

  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: null,
      output: {},
    },
    {
      test: 'returns error when fetch fails',
      input: new Error('Test'),
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns favorite tokens when there is data',
      input: [project],
      output: { data: tokenProjectToCurrencyInfos([projectWithFavoritesOnly]) },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      jest.spyOn(console, 'error').mockImplementation(jest.fn())
    }

    const { resolvers } = queryResolvers({
      tokenProjects: queryResolver(input),
    })
    const { result } = renderHook(() => useFavoriteCurrencies(), {
      resolvers,
      preloadedState,
    })

    expect(result.current.loading).toEqual(true)

    await waitFor(async () => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(useFilterCallbacks, () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

    expect(result.current).toEqual({
      chainFilter: null,
      searchFilter: null,
      onChangeText: expect.any(Function),
      onChangeChainFilter: expect.any(Function),
      onClearSearchFilter: expect.any(Function),
    })
  })

  describe('search filter', () => {
    it('updates search filter when text changes', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.searchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('test')
      })

      expect(result.current.searchFilter).toEqual('test')
    })

    it('clears search filter onClearSearchFilter is called', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.searchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('test')
      })

      expect(result.current.searchFilter).toEqual('test')

      await act(() => {
        result.current.onClearSearchFilter()
      })

      expect(result.current.searchFilter).toEqual(null)
    })
  })

  describe('chain filter', () => {
    it('returns initial chain filter corresponding to the chainId', () => {
      const { result } = renderHook(useFilterCallbacks, {
        initialProps: [ChainId.ArbitrumOne, TokenSelectorFlow.Swap],
      })

      expect(result.current.chainFilter).toEqual(ChainId.ArbitrumOne)
    })

    it('updates chain filter when chainId property changes', async () => {
      const { result, rerender } = renderHook(useFilterCallbacks, {
        initialProps: [ChainId.ArbitrumOne, TokenSelectorFlow.Swap],
      })

      expect(result.current.chainFilter).toEqual(ChainId.ArbitrumOne)

      await act(() => {
        rerender([ChainId.Base, TokenSelectorFlow.Swap])
      })

      expect(result.current.chainFilter).toEqual(ChainId.Base)
    })

    it('updates chain filter when onChangeChainFilter is called', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.chainFilter).toEqual(null)

      await act(() => {
        result.current.onChangeChainFilter(ChainId.ArbitrumOne)
      })

      expect(result.current.chainFilter).toEqual(ChainId.ArbitrumOne)

      await act(() => {
        result.current.onChangeChainFilter(ChainId.Base)
      })

      expect(result.current.chainFilter).toEqual(ChainId.Base)
    })
  })
})

describe(useCurrencyInfosToTokenOptions, () => {
  const ethInfo = ethCurrencyInfo()
  const usdcBaseInfo = usdcCurrencyInfo()
  const arbitrumDaiInfo = arbitrumDaiCurrencyInfo()
  const currencyInfos = [ethInfo, usdcBaseInfo, arbitrumDaiInfo]
  const balancesById = portfolioBalancesById([portfolioBalance({ fromToken: ethToken() })])

  const cases = [
    {
      test: 'returns undefined if currencyInfos is undefined',
      input: {
        currencyInfos: undefined,
        sortAlphabetically: false,
        portfolioBalancesById: portfolioBalancesById(),
      },
      output: undefined,
    },
    {
      test: 'returns currency infos mapped to token options',
      input: { currencyInfos, sortAlphabetically: false, portfolioBalancesById: balancesById },
      output: [
        // ETH exists in the balancesById so we will get its balance
        balancesById[ethInfo.currencyId],
        // USDC and Arbitrum DAI do not exist in the balancesById so we will create empty balance options
        createEmptyBalanceOption(usdcBaseInfo),
        createEmptyBalanceOption(arbitrumDaiInfo),
      ],
    },
    {
      test: 'sorts returned currency infos alphabetically when sortAlphabetically is true',
      input: { currencyInfos, sortAlphabetically: true, portfolioBalancesById: balancesById },
      output: [
        // Arbitrum DAI does not exist in the portfolioBalancesById so we will create empty balance options
        createEmptyBalanceOption(arbitrumDaiInfo), // Chain name: Arbitrum ETH
        // USDC does not exist in the portfolioBalancesById so we will create empty balance options
        createEmptyBalanceOption(usdcBaseInfo), // Chain name: Base ETH
        // ETH exists in the portfolioBalancesById so we will get its balance
        balancesById[ethInfo.currencyId], // Chain name: ETH
      ],
    },
  ]

  it.each(cases)('$test', ({ input, output }) => {
    const { result } = renderHook(() => useCurrencyInfosToTokenOptions(input))

    expect(result.current).toEqual(output)
  })
})

describe(usePortfolioBalancesForAddressById, () => {
  const Portfolio = portfolio()
  const balances = portfolioBalances({ portfolio: Portfolio })
  const balancesById = portfolioBalancesById(balances)

  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: null,
      output: {},
    },
    {
      test: 'returns error when fetch fails',
      input: new Error('Test'),
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns portfolio balances when there is data',
      input: [Portfolio],
      output: { data: balancesById },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      jest.spyOn(console, 'error').mockImplementation(jest.fn())
    }

    const { resolvers } = queryResolvers({
      portfolios: queryResolver(input),
    })
    const { result } = renderHook(() => usePortfolioBalancesForAddressById(SAMPLE_SEED_ADDRESS_1), {
      resolvers,
    })

    expect(result.current.loading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(usePortfolioTokenOptions, () => {
  describe('no data test cases', () => {
    const cases = [
      {
        test: 'returns undefined when there is no data',
        input: null,
        output: { data: undefined },
      },
      {
        test: 'returns error when fetch fails',
        input: new Error('Test'),
        output: { error: new ApolloError({ errorMessage: 'Test' }) },
      },
    ]

    it.each(cases)('$test', async ({ input, output }) => {
      if (input instanceof Error) {
        jest.spyOn(console, 'error').mockImplementation(jest.fn())
      }

      const { resolvers } = queryResolvers({
        portfolios: queryResolver(input),
      })
      const { result } = renderHook(() => usePortfolioTokenOptions(SAMPLE_SEED_ADDRESS_1, null), {
        resolvers,
      })

      expect(result.current.loading).toEqual(true)

      await waitFor(() => {
        expect(result.current).toEqual({
          loading: false,
          refetch: expect.any(Function),
          ...output,
        })
      })
    })
  })

  describe('shown tokens', () => {
    // Token balances
    const ethTokenBalance = tokenBalance({ isHidden: false, token: ethToken() })
    const usdcTokenBalance = tokenBalance({ isHidden: false, token: usdcBaseToken() })
    const shownTokenBalances = [ethTokenBalance, usdcTokenBalance]

    // Portfolio balances
    const ethPortfolioBalance = portfolioBalance({ fromBalance: ethTokenBalance })
    const usdcPortfolioBalance = portfolioBalance({ fromBalance: usdcTokenBalance })
    const hiddenTokenBalances = createArray(2, () => tokenBalance({ isHidden: true }))
    const shownPortfolioBalances = [ethPortfolioBalance, usdcPortfolioBalance]

    const Portfolio = portfolio({ tokenBalances: [...shownTokenBalances, ...hiddenTokenBalances] })
    const { resolvers } = queryResolvers({
      portfolios: () => [Portfolio],
    })

    const cases: {
      test: string
      input: Parameters<typeof usePortfolioTokenOptions>
      output: ReturnType<typeof usePortfolioTokenOptions>
    }[] = [
      {
        test: 'returns only shown tokens after data is fetched',
        input: [SAMPLE_SEED_ADDRESS_1, null],
        output: {
          data: shownPortfolioBalances,
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns shown tokens filtered by chain',
        input: [SAMPLE_SEED_ADDRESS_1, fromGraphQLChain(usdcTokenBalance.token.chain)],
        output: {
          data: [usdcPortfolioBalance],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns shown tokens starting with "et" (ETH) filtered by search filter',
        input: [SAMPLE_SEED_ADDRESS_1, null, 'et'],
        output: {
          data: [ethPortfolioBalance],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns shown tokens starting with "us" (USDC) filtered by search filter',
        input: [SAMPLE_SEED_ADDRESS_1, null, 'us'],
        output: {
          data: [usdcPortfolioBalance],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns no data when there is no token that matches both chain and search filter',
        input: [SAMPLE_SEED_ADDRESS_1, ChainId.Base, 'et'],
        output: {
          data: [],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
    ]

    it.each(cases)('$test', async ({ input, output }) => {
      const { result } = renderHook(
        () => usePortfolioTokenOptions(...(input as Parameters<typeof usePortfolioTokenOptions>)),
        { resolvers }
      )

      await waitFor(() => {
        expect(result.current).toEqual(output)
      })
    })
  })
})

describe(usePopularTokensOptions, () => {
  const topTokens = createArray(3, token)
  const tokenBalances = topTokens.map((t) => tokenBalance({ token: t }))

  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: { topTokens: null },
      output: { data: undefined },
    },
    {
      test: 'returns error and empty balance options if portfolios query fails',
      input: { portfolios: new Error('Test'), topTokens },
      // data won't be undefined because top tokens are still being fetched
      // and empty balance options will be returned for theses tokens
      output: { data: expect.anything(), error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'retruns error if topTokens query fails',
      input: { topTokens: new Error('Test') },
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns popular token options when there is data',
      input: { portfolios: [portfolio({ tokenBalances })], topTokens },
      output: {
        data: expect.toIncludeSameMembers(
          tokenBalances.map((t) => portfolioBalance({ fromBalance: t }))
        ),
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    const { resolvers } = queryResolvers(
      Object.fromEntries(
        Object.entries(input).map(([name, resolver]) => [name, queryResolver(resolver)])
      )
    )
    const { result } = renderHook(
      () => usePopularTokensOptions(SAMPLE_SEED_ADDRESS_1, ChainId.ArbitrumOne),
      { resolvers }
    )

    expect(result.current.loading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(useCommonTokensOptions, () => {
  const tokens = [eth, dai, usdc]
  const tokenBalances = [ethBalance, daiBalance, usdcBalance]

  const cases = [
    {
      test: 'returns undefined when there is no tokenProjects data',
      input: { tokenProjects: null },
      output: {},
    },
    {
      test: 'retruns error if portfolios query fails',
      input: { portfolios: new Error('Test') },
      output: { data: [], error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'retruns error and no data if tokenProjects query fails',
      input: { tokenProjects: new Error('Test') },
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'return balancs for all tokens if no chain filter is specified',
      input: {
        portfolios: [portfolio({ tokenBalances })],
        tokenProjects: [tokenProject({ tokens })],
      },
      output: {
        data: expect.toIncludeSameMembers(
          tokenBalances.map((t) => portfolioBalance({ fromBalance: t }))
        ),
        error: undefined,
      },
    },
    {
      test: 'returns balances for tokens in the tokenProject filtered by chain',
      input: {
        portfolios: [portfolio({ tokenBalances })],
        tokenProjects: [tokenProject({ tokens })],
        chainFilter: ChainId.Mainnet,
      },
      output: {
        data: expect.toIncludeSameMembers([
          // DAI and ETH have Mainnet chain
          portfolioBalance({ fromBalance: ethBalance }),
          portfolioBalance({ fromBalance: daiBalance }),
        ]),
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ input: { chainFilter = null, ...resolverResults }, output }) => {
    const { resolvers } = queryResolvers(
      Object.fromEntries(
        Object.entries(resolverResults).map(([name, resolver]) => [name, queryResolver(resolver)])
      )
    )
    const { result } = renderHook(
      () => useCommonTokensOptions(SAMPLE_SEED_ADDRESS_1, chainFilter),
      { resolvers }
    )

    expect(result.current.loading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(useFavoriteTokensOptions, () => {
  const tokenBalances = [...favoriteTokenBalances, ...createArray(3, tokenBalance)]

  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: { portfolios: null, tokenProjects: null },
      output: {},
    },
    {
      test: 'retruns error if portfolios query fails',
      input: { portfolios: new Error('Test') },
      output: { data: [], error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'retruns error and no data if tokenProjects query fails',
      input: { tokenProjects: new Error('Test') },
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns balances for all favorite tokens in portfolios if no chain filter is specified',
      input: {
        portfolios: [portfolio({ tokenBalances })],
        tokenProjects: [tokenProject({ tokens: favoriteTokens })],
      },
      output: {
        data: expect.toIncludeSameMembers(
          favoriteTokenBalances.map((balance) => portfolioBalance({ fromBalance: balance }))
        ),
        error: undefined,
      },
    },
    {
      test: 'returns balances for favorite tokens in the tokenProject filtered by chain',
      input: {
        portfolios: [portfolio({ tokenBalances })],
        tokenProjects: [tokenProject({ tokens: favoriteTokens })],
        chainFilter: ChainId.Mainnet,
      },
      output: {
        data: expect.toIncludeSameMembers([
          // DAI and ETH have Mainnet chain
          portfolioBalance({ fromBalance: ethBalance }),
          portfolioBalance({ fromBalance: daiBalance }),
        ]),
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ input: { chainFilter = null, ...resolverResults }, output }) => {
    const { resolvers } = queryResolvers(
      Object.fromEntries(
        Object.entries(resolverResults).map(([name, resolver]) => [name, queryResolver(resolver)])
      )
    )
    const { result } = renderHook(
      () => useFavoriteTokensOptions(SAMPLE_SEED_ADDRESS_1, chainFilter),
      { resolvers, preloadedState }
    )

    expect(result.current.loading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})
