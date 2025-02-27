/* eslint-disable max-lines */
import { ApolloError } from '@apollo/client'
import { toIncludeSameMembers } from 'jest-extended'
import { PreloadedState } from 'redux'
import { useAllCommonBaseCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useAllCommonBaseCurrencies'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useFavoriteCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteCurrencies'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { useFilterCallbacks } from 'uniswap/src/components/TokenSelector/hooks/useFilterCallbacks'
import { usePopularTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/usePopularTokensOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { createEmptyBalanceOption } from 'uniswap/src/components/TokenSelector/utils'
import { BRIDGED_BASE_ADDRESSES } from 'uniswap/src/constants/addresses'
import { Chain, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/utils'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
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
} from 'uniswap/src/test/fixtures'
import { act, renderHook, waitFor } from 'uniswap/src/test/test-utils'
import { createArray, queryResolvers } from 'uniswap/src/test/utils'
import { portfolioBalancesById } from 'uniswap/src/utils/balances'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

expect.extend({ toIncludeSameMembers })

jest.mock('uniswap/src/features/telemetry/send')

const eth = ethToken()
const dai = daiToken()
const usdc_base = usdcBaseToken()
const ethBalance = tokenBalance({ token: eth })
const daiBalance = tokenBalance({ token: dai })
const usdcBaseBalance = tokenBalance({ token: usdc_base })
const favoriteTokens = [eth, dai, usdc_base]
const favoriteTokenBalances = [ethBalance, daiBalance, usdcBaseBalance]

const favoriteCurrencyIds = favoriteTokens.map((t) =>
  buildCurrencyId(fromGraphQLChain(t.chain) ?? UniverseChainId.Mainnet, t.address),
)

const preloadedState: PreloadedState<UniswapState> = {
  favorites: {
    tokens: favoriteCurrencyIds,
    watchedAddresses: [],
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

  const nonBridgedTokens = [ethToken(), daiToken(), usdcToken(), usdcBaseToken(), usdcArbitrumToken()]
  const bridgedTokens = BRIDGED_BASE_ADDRESSES.map((address) => token({ address, chain: Chain.Ethereum }))
  const projectWithBridged = tokenProject({ tokens: [...nonBridgedTokens, ...bridgedTokens] })
  const tokenProjectWithoutBridged = {
    ...projectWithBridged, // Copy all props except tokens (leave only non-bridged tokens)
    tokens: nonBridgedTokens,
  }

  const cases = [
    {
      test: 'returns undefined if there is no data',
      input: undefined,
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
    tokens: [usdcArbitrumToken(), usdcToken(), ...favoriteTokens],
    safetyLevel: SafetyLevel.Verified,
  })
  const projectWithFavoritesOnly = tokenProject({
    tokens: favoriteTokens,
    safetyLevel: SafetyLevel.Verified,
  })

  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: undefined,
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
      parsedChainFilter: null,
      searchFilter: null,
      parsedSearchFilter: null,
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

    it('parses chain from search filter', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('BaSE uni')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('BaSE uni')
      expect(result.current.parsedChainFilter).toEqual(UniverseChainId.Base)
      expect(result.current.parsedSearchFilter).toEqual('uni')
    })

    it('does not parse chain when chainFilter is set', async () => {
      const { result } = renderHook(useFilterCallbacks, {
        initialProps: [UniverseChainId.ArbitrumOne, TokenSelectorFlow.Swap],
      })

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('base uni')
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)
      expect(result.current.searchFilter).toEqual('base uni')
      expect(result.current.parsedSearchFilter).toEqual(null)
      expect(result.current.parsedSearchFilter).toEqual(null)
    })

    it('does not parse unsupported chains', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('UNSUPPORTED uni')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('UNSUPPORTED uni')
      expect(result.current.parsedChainFilter).toEqual(null)
      expect(result.current.parsedSearchFilter).toEqual(null)
    })

    it('only parses after the first space', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('base uni corn')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('base uni corn')
      expect(result.current.parsedChainFilter).toEqual(UniverseChainId.Base)
      expect(result.current.parsedSearchFilter).toEqual('uni corn')
    })
  })

  describe('chain filter', () => {
    it('returns initial chain filter corresponding to the chainId', () => {
      const { result } = renderHook(useFilterCallbacks, {
        initialProps: [UniverseChainId.ArbitrumOne, TokenSelectorFlow.Swap],
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)
    })

    it('updates chain filter when chainId property changes', async () => {
      const { result, rerender } = renderHook(useFilterCallbacks, {
        initialProps: [UniverseChainId.ArbitrumOne, TokenSelectorFlow.Swap],
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)

      await act(() => {
        rerender([UniverseChainId.Base, TokenSelectorFlow.Swap])
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.Base)
    })

    it('updates chain filter when onChangeChainFilter is called', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, TokenSelectorFlow.Swap))

      expect(result.current.chainFilter).toEqual(null)

      await act(() => {
        result.current.onChangeChainFilter(UniverseChainId.ArbitrumOne)
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)

      await act(() => {
        result.current.onChangeChainFilter(UniverseChainId.Base)
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.Base)
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
      input: undefined,
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
        input: undefined,
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
        input: [SAMPLE_SEED_ADDRESS_1, UniverseChainId.Base, 'et'],
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
        { resolvers },
      )

      await waitFor(() => {
        expect(result.current).toEqual(output)
      })
    })
  })
})

// for usePopularTokensOptions, dummy placeholder implementation of useTokenRankingsQuery REST hook, which is used only if token_selector_trending_tokens feature flag is enabled
// Test fails to compile if this is not mocked
jest.mock('uniswap/src/data/rest/tokenRankings', () => ({
  useTokenRankingsQuery: (): { data: undefined; isLoading: boolean; isError: boolean } => ({
    data: undefined,
    isLoading: true,
    isError: false,
  }),
}))

describe(usePopularTokensOptions, () => {
  const topTokens = createArray(3, token)
  const tokenBalances = topTokens.map((t) => tokenBalance({ token: t }))
  const portfolios = [portfolio({ tokenBalances })]

  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: { topTokens: null, portfolios },
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
      test: 'returns error if topTokens query fails',
      input: { topTokens: new Error('Test'), portfolios },
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns popular token options when there is data',
      input: { portfolios, topTokens },
      output: {
        data: expect.toIncludeSameMembers(tokenBalances.map((t) => portfolioBalance({ fromBalance: t }))),
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    const { resolvers } = queryResolvers(
      Object.fromEntries(Object.entries(input).map(([name, resolver]) => [name, queryResolver(resolver)])),
    )
    const { result } = renderHook(() => usePopularTokensOptions(SAMPLE_SEED_ADDRESS_1, UniverseChainId.ArbitrumOne), {
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

describe(useCommonTokensOptionsWithFallback, () => {
  const tokens = [eth, dai, usdc_base]
  const tokenBalances = [ethBalance, daiBalance, usdcBaseBalance]
  const portfolios = [portfolio({ tokenBalances })]

  const cases = [
    {
      test: 'returns undefined when there is no tokenProjects data',
      input: { portfolios, tokenProjects: null },
      output: {},
    },
    {
      test: 'retruns error if portfolios query fails',
      input: { portfolios: new Error('Test') },
      output: { data: [], error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'retruns error and no data if tokenProjects query fails',
      input: { portfolios, tokenProjects: new Error('Test') },
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'return balancs for all tokens if no chain filter is specified',
      input: {
        portfolios: [portfolio({ tokenBalances })],
        tokenProjects: [tokenProject({ tokens })],
      },
      output: {
        data: expect.toIncludeSameMembers(tokenBalances.map((t) => portfolioBalance({ fromBalance: t }))),
        error: undefined,
      },
    },
    {
      test: 'returns balances for tokens in the tokenProject filtered by chain',
      input: {
        portfolios,
        tokenProjects: [tokenProject({ tokens })],
        chainFilter: UniverseChainId.Mainnet as UniverseChainId,
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
      Object.fromEntries(Object.entries(resolverResults).map(([name, resolver]) => [name, queryResolver(resolver)])),
    )
    const { result } = renderHook(() => useCommonTokensOptionsWithFallback(SAMPLE_SEED_ADDRESS_1, chainFilter), {
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

describe(useFavoriteTokensOptions, () => {
  const tokenBalances = [...favoriteTokenBalances, ...createArray(3, tokenBalance)]
  const portfolios = [portfolio({ tokenBalances })]

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
      input: { portfolios, tokenProjects: new Error('Test') },
      output: { error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns balances for all favorite tokens in portfolios if no chain filter is specified',
      input: {
        portfolios,
        tokenProjects: [tokenProject({ tokens: favoriteTokens })],
      },
      output: {
        data: expect.toIncludeSameMembers(
          favoriteTokenBalances.map((balance) => portfolioBalance({ fromBalance: balance })),
        ),
        error: undefined,
      },
    },
    {
      test: 'returns balances for favorite tokens in the tokenProject filtered by chain',
      input: {
        portfolios: [portfolio({ tokenBalances })],
        tokenProjects: [tokenProject({ tokens: favoriteTokens })],
        chainFilter: UniverseChainId.Mainnet as UniverseChainId,
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
      Object.fromEntries(Object.entries(resolverResults).map(([name, resolver]) => [name, queryResolver(resolver)])),
    )
    const { result } = renderHook(() => useFavoriteTokensOptions(SAMPLE_SEED_ADDRESS_1, chainFilter), {
      resolvers,
      preloadedState,
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
