import { ApolloError } from '@apollo/client'
import { ConnectError } from '@connectrpc/connect'
import { UseQueryResult } from '@tanstack/react-query'
import { TokenRankingsResponse, TokenRankingsStat } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { GraphQLApi } from '@universe/api'
import { toIncludeSameMembers } from 'jest-extended'
import { PreloadedState } from 'redux'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { useAllCommonBaseCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useAllCommonBaseCurrencies'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import {
  createEmptyBalanceOption,
  useCurrencyInfosToTokenOptions,
} from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useFavoriteCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteCurrencies'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { BRIDGED_BASE_ADDRESSES } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { tokenProjectToCurrencyInfos } from 'uniswap/src/features/dataApi/tokenProjects/utils/tokenProjectToCurrencyInfos'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
import {
  arbitrumDaiCurrencyInfo,
  daiToken,
  ethCurrencyInfo,
  ethToken,
  portfolio,
  portfolioBalance,
  SAMPLE_SEED_ADDRESS_1,
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

jest.mock('uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById', () => ({
  usePortfolioBalancesForAddressById: jest.fn(),
}))

jest.mock('uniswap/src/data/rest/tokenRankings', () => ({
  useTokenRankingsQuery: jest.fn(),
  CustomRankingType: {
    Trending: 'TRENDING',
  },
  tokenRankingsStatToCurrencyInfo: jest.fn(),
}))

// Helper to convert undefined to null for GraphQL compatibility
const convertUndefinedToNull = <T extends { isBridged?: boolean | null; bridgedWithdrawalInfo?: any }>(
  items: T[],
): T[] =>
  items.map((item) => ({
    ...item,
    isBridged: item.isBridged ?? null,
    bridgedWithdrawalInfo: item.bridgedWithdrawalInfo ?? null,
  }))

const mockPortfolioHook = jest.requireMock(
  'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById',
)
const mockUsePortfolioBalancesForAddressById = mockPortfolioHook.usePortfolioBalancesForAddressById

const mockTokenRankings = jest.requireMock('uniswap/src/data/rest/tokenRankings')
const mockUseTokenRankingsQuery = mockTokenRankings.useTokenRankingsQuery
const mockTokenRankingsStatToCurrencyInfo = mockTokenRankings.tokenRankingsStatToCurrencyInfo

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

// Helper functions for mocking portfolio hook responses
function mockPortfolioBalancesHook(result: ReturnType<typeof tokenBalance>[] | Error | undefined | null): any {
  if (result instanceof Error) {
    return {
      data: undefined,
      error: result,
      loading: false,
      refetch: jest.fn(),
    }
  }

  if (result === undefined || result === null) {
    return {
      data: undefined,
      error: undefined,
      loading: false,
      refetch: jest.fn(),
    }
  }

  // Convert GraphQL token balances to portfolio balances using the existing fixture
  const portfolioBalancesArray = result.map((balance) => portfolioBalance({ fromBalance: balance }))
  const balancesById = portfolioBalancesById(portfolioBalancesArray)

  return {
    data: balancesById,
    error: undefined,
    loading: false,
    refetch: jest.fn(),
  }
}

describe(useAllCommonBaseCurrencies, () => {
  const projects = createArray(3, tokenProject)

  const nonBridgedTokens = [ethToken(), daiToken(), usdcToken(), usdcBaseToken(), usdcArbitrumToken()]
  const bridgedTokens = BRIDGED_BASE_ADDRESSES.map((address) => token({ address, chain: GraphQLApi.Chain.Ethereum }))
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
      output: { data: convertUndefinedToNull(tokenProjectToCurrencyInfos(projects)) },
    },
    {
      test: 'filters out currencies that have a bridged version on other networks',
      input: [projectWithBridged],
      output: { data: convertUndefinedToNull(tokenProjectToCurrencyInfos([tokenProjectWithoutBridged])) },
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
    safetyLevel: GraphQLApi.SafetyLevel.Verified,
  })
  const projectWithFavoritesOnly = tokenProject({
    tokens: favoriteTokens,
    safetyLevel: GraphQLApi.SafetyLevel.Verified,
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
      output: { data: convertUndefinedToNull(tokenProjectToCurrencyInfos([projectWithFavoritesOnly])) },
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
    const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

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
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

      expect(result.current.searchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('test')
      })

      expect(result.current.searchFilter).toEqual('test')
    })

    it('clears search filter onClearSearchFilter is called', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

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
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

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
        initialProps: [UniverseChainId.ArbitrumOne, ModalName.Swap],
      })

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('base uni')
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)
      expect(result.current.searchFilter).toEqual('base uni')
      expect(result.current.parsedSearchFilter).toEqual(null)
    })

    it('does not parse unsupported chains', async () => {
      const searchText = 'UNSUPPORTED uni'
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText(searchText)
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual(searchText)
      expect(result.current.parsedChainFilter).toEqual(null)
      expect(result.current.parsedSearchFilter).toEqual(searchText)
    })

    it('only parses after the first space', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('base uni corn')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('base uni corn')
      expect(result.current.parsedChainFilter).toEqual(UniverseChainId.Base)
      expect(result.current.parsedSearchFilter).toEqual('uni corn')
    })

    it('parses chain from end of search filter', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('uni BaSE')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('uni BaSE')
      expect(result.current.parsedChainFilter).toEqual(UniverseChainId.Base)
      expect(result.current.parsedSearchFilter).toEqual('uni')
    })

    it('parses chain from end with multiple search words', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('uni corn token base')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('uni corn token base')
      expect(result.current.parsedChainFilter).toEqual(UniverseChainId.Base)
      expect(result.current.parsedSearchFilter).toEqual('uni corn token')
    })

    it('prioritizes first word chain match over last word', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText('base token ethereum')
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual('base token ethereum')
      expect(result.current.parsedChainFilter).toEqual(UniverseChainId.Base)
      expect(result.current.parsedSearchFilter).toEqual('token ethereum')
    })

    it('does not parse unsupported chains from end', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))
      const searchText = 'uni UNSUPPORTED'

      expect(result.current.parsedSearchFilter).toEqual(null)

      await act(() => {
        result.current.onChangeText(searchText)
      })

      expect(result.current.chainFilter).toEqual(null)
      expect(result.current.searchFilter).toEqual(searchText)
      expect(result.current.parsedChainFilter).toEqual(null)
      expect(result.current.parsedSearchFilter).toEqual(searchText)
    })
  })

  describe('chain filter', () => {
    it('returns initial chain filter corresponding to the chainId', () => {
      const { result } = renderHook(useFilterCallbacks, {
        initialProps: [UniverseChainId.ArbitrumOne, ModalName.Swap],
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)
    })

    it('updates chain filter when chainId property changes', async () => {
      const { result, rerender } = renderHook(useFilterCallbacks, {
        initialProps: [UniverseChainId.ArbitrumOne, ModalName.Swap],
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.ArbitrumOne)

      await act(() => {
        rerender([UniverseChainId.Base, ModalName.Swap])
      })

      expect(result.current.chainFilter).toEqual(UniverseChainId.Base)
    })

    it('updates chain filter when onChangeChainFilter is called', async () => {
      const { result } = renderHook(() => useFilterCallbacks(null, ModalName.Swap))

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
        { ...balancesById[ethInfo.currencyId], type: OnchainItemListOptionType.Token },
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
        createEmptyBalanceOption(arbitrumDaiInfo), // GraphQLApi.Chain name: Arbitrum ETH
        // USDC does not exist in the portfolioBalancesById so we will create empty balance options
        createEmptyBalanceOption(usdcBaseInfo), // GraphQLApi.Chain name: Base ETH
        // ETH exists in the portfolioBalancesById so we will get its balance
        { ...balancesById[ethInfo.currencyId], type: OnchainItemListOptionType.Token }, // GraphQLApi.Chain name: ETH
      ],
    },
  ]

  it.each(cases)('$test', ({ input, output }) => {
    const { result } = renderHook(() => useCurrencyInfosToTokenOptions(input))

    expect(result.current).toEqual(output)
  })
})

describe(usePortfolioBalancesForAddressById, () => {
  const cases = [
    {
      test: 'returns undefined when there is no data',
      input: undefined,
      output: { data: undefined },
    },
    {
      test: 'returns error when fetch fails',
      input: new Error('Test'),
      output: { data: undefined, error: new Error('Test') },
    },
    {
      test: 'returns portfolio balances when there is data',
      input: [ethBalance, daiBalance, usdcBaseBalance],
      output: {
        data: expect.any(Object), // Contains portfolio balances keyed by currency ID
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      jest.spyOn(console, 'error').mockImplementation(jest.fn())
    }

    mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(input))

    const { result } = renderHook(() => usePortfolioBalancesForAddressById({ evmAddress: SAMPLE_SEED_ADDRESS_1 }))

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
        output: { data: undefined, error: new Error('Test') },
      },
    ]

    it.each(cases)('$test', async ({ input, output }) => {
      if (input instanceof Error) {
        jest.spyOn(console, 'error').mockImplementation(jest.fn())
      }

      mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(input))

      const { result } = renderHook(() =>
        usePortfolioTokenOptions({ evmAddress: SAMPLE_SEED_ADDRESS_1, svmAddress: undefined, chainFilter: null }),
      )

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
    const ethPortfolioBalanceTokenOption: TokenOption = {
      ...portfolioBalance({ fromBalance: ethTokenBalance }),
      type: OnchainItemListOptionType.Token,
    }
    const usdcPortfolioBalanceTokenOption: TokenOption = {
      ...portfolioBalance({ fromBalance: usdcTokenBalance }),
      type: OnchainItemListOptionType.Token,
    }
    const hiddenTokenBalances = createArray(2, () => tokenBalance({ isHidden: true }))
    const shownPortfolioBalanceTokenOptions = [ethPortfolioBalanceTokenOption, usdcPortfolioBalanceTokenOption]

    const allTokenBalances = [...shownTokenBalances, ...hiddenTokenBalances]

    const cases: {
      test: string
      input: Parameters<typeof usePortfolioTokenOptions>[0]
      output: ReturnType<typeof usePortfolioTokenOptions>
    }[] = [
      {
        test: 'returns only shown tokens after data is fetched',
        input: { evmAddress: SAMPLE_SEED_ADDRESS_1, svmAddress: undefined, chainFilter: null },
        output: {
          data: shownPortfolioBalanceTokenOptions,
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns shown tokens filtered by chain',
        input: {
          evmAddress: SAMPLE_SEED_ADDRESS_1,
          svmAddress: undefined,
          chainFilter: fromGraphQLChain(usdcTokenBalance.token.chain),
        },
        output: {
          data: [usdcPortfolioBalanceTokenOption],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns shown tokens starting with "et" (ETH) filtered by search filter',
        input: { evmAddress: SAMPLE_SEED_ADDRESS_1, svmAddress: undefined, chainFilter: null, searchFilter: 'et' },
        output: {
          data: [ethPortfolioBalanceTokenOption],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns shown tokens starting with "us" (USDC) filtered by search filter',
        input: { evmAddress: SAMPLE_SEED_ADDRESS_1, svmAddress: undefined, chainFilter: null, searchFilter: 'us' },
        output: {
          data: [usdcPortfolioBalanceTokenOption],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
      {
        test: 'returns no data when there is no token that matches both chain and search filter',
        input: {
          evmAddress: SAMPLE_SEED_ADDRESS_1,
          svmAddress: undefined,
          chainFilter: UniverseChainId.Base,
          searchFilter: 'et',
        },
        output: {
          data: [],
          loading: false,
          refetch: expect.any(Function),
          error: undefined,
        },
      },
    ]

    it.each(cases)('$test', async ({ input, output }) => {
      mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(allTokenBalances))

      const { result } = renderHook(() => usePortfolioTokenOptions(input))

      await waitFor(() => {
        expect(result.current).toEqual(output)
      })
    })
  })
})

describe(useTrendingTokensOptions, () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockUseTokenRankingsQuery.mockReset()
    mockTokenRankingsStatToCurrencyInfo.mockReset()

    // Mock the currency info conversion function
    mockTokenRankingsStatToCurrencyInfo.mockImplementation((tokenRankingsStat: TokenRankingsStat) => ({
      currencyId: buildCurrencyId(
        fromGraphQLChain(tokenRankingsStat.chain) ?? UniverseChainId.Mainnet,
        tokenRankingsStat.address,
      ),
      currency: {
        address: tokenRankingsStat.address,
        chainId: fromGraphQLChain(tokenRankingsStat.chain) ?? UniverseChainId.Mainnet,
        name: tokenRankingsStat.name,
        symbol: tokenRankingsStat.symbol,
        decimals: tokenRankingsStat.decimals,
      },
      logoUrl: tokenRankingsStat.logo,
      safetyLevel: GraphQLApi.SafetyLevel.Verified,
    }))
  })

  const topTokens = createArray(3, token)
  const tokenRankingsResponse = {
    tokenRankings: {
      TRENDING: {
        tokens: topTokens.map((t) => ({
          chain: t.chain,
          address: t.address,
          name: t.name,
          symbol: t.symbol,
          decimals: t.decimals,
        })),
      },
    },
  } as unknown as TokenRankingsResponse
  const tokenBalances = topTokens.map((t) => tokenBalance({ token: t }))
  const portfolios = [portfolio({ tokenBalances })]

  it('returns undefined when there is no data', async () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: {
        tokenRankings: {
          TRENDING: {
            tokens: [],
          },
        },
      } as unknown as TokenRankingsResponse,
      isLoading: false,
      isFetching: false,
      error: null,
    } as UseQueryResult<TokenRankingsResponse, ConnectError>)

    mockUsePortfolioBalancesForAddressById.mockReturnValue(
      mockPortfolioBalancesHook(portfolios[0]?.tokenBalances || []),
    )

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        chainFilter: UniverseChainId.ArbitrumOne,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: [],
        error: undefined,
        refetch: expect.any(Function),
      })
    })
  })

  it('returns error and empty balance options if portfolios query fails', async () => {
    // Mock the REST API to return success with data
    mockUseTokenRankingsQuery.mockReturnValue({
      data: tokenRankingsResponse,
      isLoading: false,
      isFetching: false,
      error: null,
    })

    mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(new Error('Test')))

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        chainFilter: UniverseChainId.ArbitrumOne,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        // data won't be undefined because top tokens are still being fetched
        // and empty balance options will be returned for these tokens
        data: expect.anything(),
        error: new Error('Test'),
        refetch: expect.any(Function),
      })
    })
  })

  it('returns error if token rankings query fails', async () => {
    // Mock the REST API to return an error
    mockUseTokenRankingsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('Failed to fetch trending tokens'),
    })

    mockUsePortfolioBalancesForAddressById.mockReturnValue(
      mockPortfolioBalancesHook(portfolios[0]?.tokenBalances || []),
    )

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        chainFilter: UniverseChainId.ArbitrumOne,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        error: new Error('Failed to fetch trending tokens'),
        refetch: expect.any(Function),
      })
    })
  })

  it('returns trending token options when there is data', async () => {
    mockUseTokenRankingsQuery.mockReturnValue({
      data: tokenRankingsResponse,
      isLoading: false,
      isFetching: false,
      error: null,
    })

    mockUsePortfolioBalancesForAddressById.mockReturnValue(
      mockPortfolioBalancesHook(portfolios[0]?.tokenBalances || []),
    )

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        svmAddress: undefined,
        chainFilter: UniverseChainId.ArbitrumOne,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: expect.toIncludeSameMembers(
          tokenBalances.map((t) => ({
            ...portfolioBalance({ fromBalance: t }),
            type: OnchainItemListOptionType.Token,
          })),
        ),
        error: undefined,
        refetch: expect.any(Function),
      })
    })
  })
})

describe(useCommonTokensOptionsWithFallback, () => {
  const tokens = [eth, dai, usdc_base]
  const tokenBalances = [ethBalance, daiBalance, usdcBaseBalance]

  const cases = [
    {
      test: 'returns undefined when there is no tokenProjects data',
      portfolioInput: tokenBalances,
      tokenProjectsInput: undefined,
      chainFilter: null,
      output: { data: undefined },
    },
    {
      test: 'returns error if portfolios query fails',
      portfolioInput: new Error('Test'),
      tokenProjectsInput: [tokenProject({ tokens })],
      chainFilter: null,
      output: {
        data: expect.anything(), // Returns fallback tokens from tokenProjects
        error: new Error('Test'), // Shows the portfolio error
      },
    },
    {
      test: 'returns error and no data if tokenProjects query fails',
      portfolioInput: tokenBalances,
      tokenProjectsInput: new Error('Test'),
      chainFilter: null,
      output: { data: undefined, error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'return balances for all tokens if no chain filter is specified',
      portfolioInput: tokenBalances,
      tokenProjectsInput: [tokenProject({ tokens })],
      chainFilter: null,
      output: {
        data: expect.toIncludeSameMembers(
          tokenBalances.map((t) => ({
            ...portfolioBalance({ fromBalance: t }),
            type: OnchainItemListOptionType.Token,
          })),
        ),
        error: undefined,
      },
    },
    {
      test: 'returns balances for tokens in the tokenProject filtered by chain',
      portfolioInput: tokenBalances,
      tokenProjectsInput: [tokenProject({ tokens })],
      chainFilter: UniverseChainId.Mainnet as UniverseChainId,
      output: {
        data: expect.toIncludeSameMembers([
          // DAI and ETH have Mainnet chain
          { ...portfolioBalance({ fromBalance: ethBalance }), type: OnchainItemListOptionType.Token },
          { ...portfolioBalance({ fromBalance: daiBalance }), type: OnchainItemListOptionType.Token },
        ]),
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ portfolioInput, tokenProjectsInput, chainFilter, output }) => {
    mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(portfolioInput))

    // Mock the GraphQL tokenProjects query
    const { resolvers } = queryResolvers({
      tokenProjects: queryResolver(tokenProjectsInput),
    })
    const { result } = renderHook(
      () =>
        useCommonTokensOptionsWithFallback({
          evmAddress: SAMPLE_SEED_ADDRESS_1,
          svmAddress: undefined,
          chainFilter,
        }),
      {
        resolvers,
      },
    )

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
      portfolioInput: undefined,
      tokenProjectsInput: undefined,
      chainFilter: null,
      output: { data: undefined },
    },
    {
      test: 'returns error if portfolios query fails',
      portfolioInput: new Error('Test'),
      tokenProjectsInput: [tokenProject({ tokens: favoriteTokens })],
      chainFilter: null,
      output: {
        data: expect.anything(), // Returns fallback tokens from tokenProjects
        error: new Error('Test'), // Shows the portfolio error
      },
    },
    {
      test: 'returns error and no data if tokenProjects query fails',
      portfolioInput: tokenBalances,
      tokenProjectsInput: new Error('Test'),
      chainFilter: null,
      output: { data: undefined, error: new ApolloError({ errorMessage: 'Test' }) },
    },
    {
      test: 'returns balances for all favorite tokens in portfolios if no chain filter is specified',
      portfolioInput: tokenBalances,
      tokenProjectsInput: [tokenProject({ tokens: favoriteTokens })],
      chainFilter: null,
      output: {
        data: expect.toIncludeSameMembers(
          favoriteTokenBalances.map((balance) => {
            return { ...portfolioBalance({ fromBalance: balance }), type: OnchainItemListOptionType.Token }
          }),
        ),
        error: undefined,
      },
    },
    {
      test: 'returns balances for favorite tokens in the tokenProject filtered by chain',
      portfolioInput: tokenBalances,
      tokenProjectsInput: [tokenProject({ tokens: favoriteTokens })],
      chainFilter: UniverseChainId.Mainnet as UniverseChainId,
      output: {
        data: expect.toIncludeSameMembers([
          // DAI and ETH have Mainnet chain
          { ...portfolioBalance({ fromBalance: ethBalance }), type: OnchainItemListOptionType.Token },
          { ...portfolioBalance({ fromBalance: daiBalance }), type: OnchainItemListOptionType.Token },
        ]),
        error: undefined,
      },
    },
  ]

  it.each(cases)('$test', async ({ portfolioInput, tokenProjectsInput, chainFilter, output }) => {
    mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(portfolioInput))

    // Mock the GraphQL tokenProjects query
    const { resolvers } = queryResolvers({
      tokenProjects: queryResolver(tokenProjectsInput),
    })
    const { result } = renderHook(
      () =>
        useFavoriteTokensOptions({
          evmAddress: SAMPLE_SEED_ADDRESS_1,
          svmAddress: undefined,
          chainFilter,
        }),
      {
        resolvers,
        preloadedState,
      },
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})
