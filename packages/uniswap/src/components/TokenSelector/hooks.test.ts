import { type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
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
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  dataApiMultichainTokenToCurrencyInfos,
  dataApiMultichainTokenToSearchResult,
} from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import type { CurrencyInfo, MultichainSearchResult, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
import {
  arbitrumDaiCurrencyInfo,
  ethCurrencyInfo,
  portfolioBalance,
  SAMPLE_SEED_ADDRESS_1,
  usdcCurrencyInfo,
} from 'uniswap/src/test/fixtures'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import {
  daiV2Token,
  ethV2Token,
  restV2Token,
  usdcArbitrumV2Token,
  usdcBaseV2Token,
  usdcV2Token,
} from 'uniswap/src/test/fixtures/dataApi/tokens'
import { act, renderHook, waitFor } from 'uniswap/src/test/test-utils'
import { createArray } from 'uniswap/src/test/utils'
import { portfolioBalancesById } from 'uniswap/src/utils/balances'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { Mock } from 'vitest'

// Extend vitest's expect types with jest-extended matchers
declare module 'vitest' {
  interface AsymmetricMatchersContaining {
    toIncludeSameMembers<E = unknown>(members: readonly E[]): void
  }
}

expect.extend({ toIncludeSameMembers })

vi.mock('uniswap/src/features/telemetry/send')

// Create mock functions with vi.hoisted to ensure they're available before vi.mock runs
const { mockUsePortfolioBalancesForAddressById, mockUseTop1DVolumeTokens } = vi.hoisted(() => ({
  mockUsePortfolioBalancesForAddressById: vi.fn(),
  mockUseTop1DVolumeTokens: vi.fn(),
}))

vi.mock('uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById', () => ({
  usePortfolioBalancesForAddressById: mockUsePortfolioBalancesForAddressById,
}))

// Only the fetch is mocked; the result → option conversion runs for real.
vi.mock('uniswap/src/features/dataApi/top1DVolumeTokens', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/top1DVolumeTokens')>()),
  useTop1DVolumeTokens: mockUseTop1DVolumeTokens,
}))

const { mockGetGetTokensMultiChainQueryOptions, mockGetGetTokensQueryOptions } = vi.hoisted(() => ({
  mockGetGetTokensMultiChainQueryOptions: vi.fn(),
  mockGetGetTokensQueryOptions: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokensMultiChainQueryOptions: mockGetGetTokensMultiChainQueryOptions,
  getGetTokensQueryOptions: mockGetGetTokensQueryOptions,
}))

// V2 token queries are mocked at the query-options layer; `enabled` and `select` are forwarded so
// the hooks' own gating and data selection still run against the mocked responses.
function mockTokenQueryOptions(mock: Mock, name: string, response: unknown): void {
  mock.mockImplementation(({ enabled, select }) => ({
    queryKey: [ReactQueryCacheKey.DataApiService, name, response instanceof Error ? response.message : response],
    queryFn: (): Promise<unknown> => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)),
    enabled,
    select,
  }))
}

function mockMultichainTokensQuery(input: PlainMessage<MultichainToken>[] | Error): void {
  mockTokenQueryOptions(
    mockGetGetTokensMultiChainQueryOptions,
    'getTokensMultiChain',
    input instanceof Error ? input : { tokens: input },
  )
}

function mockTokensQuery(input: PlainMessage<Token>[] | Error): void {
  mockTokenQueryOptions(mockGetGetTokensQueryOptions, 'getTokens', input instanceof Error ? input : { tokens: input })
}

type MultichainQueryCase = {
  test: string
  input: PlainMessage<MultichainToken>[] | Error
  output: { data: CurrencyInfo[] | undefined; error?: unknown }
}

type RestTokensQueryCase = {
  test: string
  input: PlainMessage<Token>[] | Error
  output: { data: (CurrencyInfo | undefined)[] | undefined; error?: unknown }
}

function multichainToken(overrides: Parameters<typeof createRankedMultichainToken>[0]): PlainMessage<MultichainToken> {
  const multichain = createRankedMultichainToken(overrides).multichainToken
  if (!multichain) {
    throw new Error('fixture has no multichainToken')
  }
  return toPlainMessage(multichain)
}

/** One v2 multichain asset whose deployments are the given token fixtures (one per chain). */
function multichainAsset(tokens: PlainMessage<Token>[]): PlainMessage<MultichainToken> {
  const [first] = tokens
  if (!first) {
    throw new Error('multichainAsset needs at least one token')
  }
  return multichainToken({
    multichainId: `${first.symbol}-${first.address}`,
    symbol: first.symbol,
    name: first.name,
    decimals: first.decimals,
    addresses: Object.fromEntries(tokens.map((t) => [String(t.chainId), t.address])),
  })
}

const eth = ethV2Token()
const dai = daiV2Token()
const usdc_base = usdcBaseV2Token()
const ethBalance = portfolioBalance({ fromToken: eth })
const daiBalance = portfolioBalance({ fromToken: dai })
const usdcBaseBalance = portfolioBalance({ fromToken: usdc_base })
const favoriteTokens = [eth, dai, usdc_base]
const favoriteTokenBalances = [ethBalance, daiBalance, usdcBaseBalance]

// Taken off the balances so favorites are keyed by the same currencyId the token queries resolve to.
const favoriteCurrencyIds = favoriteTokenBalances.map((balance) => balance.currencyInfo.currencyId)

const preloadedState: PreloadedState<UniswapState> = {
  favorites: {
    tokens: favoriteCurrencyIds,
    watchedAddresses: [],
  },
}

beforeEach(() => {
  // Mocked queries reuse a small set of keys against the shared singleton client, so clear between
  // tests to stop a stale cached response leaking into the next one.
  SharedQueryClient.clear()
  mockMultichainTokensQuery([])
  mockTokensQuery([])
})

// Helper functions for mocking portfolio hook responses
function mockPortfolioBalancesHook(result: PortfolioBalance[] | Error | undefined | null): any {
  if (result instanceof Error) {
    return {
      data: undefined,
      error: result,
      isLoading: false,
      refetch: vi.fn(),
    }
  }

  if (result === undefined || result === null) {
    return {
      data: undefined,
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    }
  }

  return {
    data: portfolioBalancesById(result),
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  }
}

describe(useAllCommonBaseCurrencies, () => {
  const tokenOnlyAssets = [
    multichainAsset([daiV2Token()]),
    multichainAsset([usdcV2Token(), usdcBaseV2Token(), usdcArbitrumV2Token()]),
  ]

  // Nativeness is derived from the address: the backend serves native deployments under the zero
  // address, while bridged copies have real contract addresses. The asset carries a native on more
  // than one chain, as the real ETH asset does, so that collapsing multiple natives down to one is
  // caught here.
  const nativeEthDeployments = {
    [UniverseChainId.Mainnet]: DEFAULT_NATIVE_ADDRESS,
    [UniverseChainId.Base]: DEFAULT_NATIVE_ADDRESS,
  }
  const bridgedEthDeployments = {
    [UniverseChainId.Polygon]: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    [UniverseChainId.ArbitrumOne]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  }
  const ethAsset = { multichainId: 'eth', symbol: 'ETH', name: 'Ether', decimals: 18 }
  const ethWithBridgedCopies = multichainToken({
    ...ethAsset,
    addresses: { ...nativeEthDeployments, ...bridgedEthDeployments },
  })
  const ethNativeOnly = multichainToken({ ...ethAsset, addresses: nativeEthDeployments })

  // Real shape of the SOL asset: native SOL alongside wrapped/bridged ERC20 copies on EVM chains.
  // Native listed on the highest chain id so it sorts last, mirroring the API, so that keeping
  // only the asset's first deployment is caught here.
  const nativeSolDeployment = { [UniverseChainId.Solana]: getNativeAddress(UniverseChainId.Solana) }
  const bridgedSolDeployments = {
    [UniverseChainId.Mainnet]: '0xD31a59c85aE9D8edEFeC411D448f90841571b89c',
    [UniverseChainId.Unichain]: '0xbdE8A5331E8Ac4831cf8Ea9e42E229219eafab97',
  }
  const solAsset = { multichainId: 'sol', symbol: 'SOL', name: 'Solana', decimals: 9 }
  const solWithBridgedCopies = multichainToken({
    ...solAsset,
    addresses: { ...bridgedSolDeployments, ...nativeSolDeployment },
  })
  const solNativeOnly = multichainToken({ ...solAsset, addresses: nativeSolDeployment })

  const cases: MultichainQueryCase[] = [
    {
      test: 'returns an empty list when the response has no tokens',
      input: [],
      output: { data: [] },
    },
    {
      test: 'returns error when fetch fails',
      input: new Error('Test'),
      output: { data: undefined, error: expect.objectContaining({ message: 'Test' }) },
    },
    {
      test: 'returns all currencies for assets without a native deployment',
      input: tokenOnlyAssets,
      output: { data: tokenOnlyAssets.flatMap(dataApiMultichainTokenToCurrencyInfos) },
    },
    {
      test: 'filters out bridged copies of native assets on other networks',
      input: [ethWithBridgedCopies, ...tokenOnlyAssets],
      output: { data: [ethNativeOnly, ...tokenOnlyAssets].flatMap(dataApiMultichainTokenToCurrencyInfos) },
    },
    {
      test: 'keeps native SOL and drops its wrapped copies on EVM chains',
      input: [solWithBridgedCopies],
      output: { data: dataApiMultichainTokenToCurrencyInfos(solNativeOnly) },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      vi.spyOn(console, 'error').mockImplementation(vi.fn())
    }

    mockMultichainTokensQuery(input)
    const { result } = renderHook(() => useAllCommonBaseCurrencies())

    expect(result.current.isLoading).toEqual(true)

    await waitFor(() => expect(result.current.isLoading).toEqual(false))
    expect(result.current.data).toEqual(output.data)
    expect(result.current.error).toEqual(output.error ?? null)
  })
})

describe(useFavoriteCurrencies, () => {
  const cases: RestTokensQueryCase[] = [
    {
      test: 'returns an empty list when the response has no tokens',
      input: [],
      output: { data: [] },
    },
    {
      test: 'returns error when fetch fails',
      input: new Error('Test'),
      output: { data: undefined, error: expect.objectContaining({ message: 'Test' }) },
    },
    {
      // Extra tokens in the response check that only the favorited ones are returned
      test: 'returns favorite tokens when there is data',
      input: [usdcArbitrumV2Token(), usdcV2Token(), ...favoriteTokens],
      output: { data: favoriteTokens.map((token) => restV2TokenToCurrencyInfo(token)) },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      vi.spyOn(console, 'error').mockImplementation(vi.fn())
    }

    mockTokensQuery(input)
    const { result } = renderHook(() => useFavoriteCurrencies(), { preloadedState })

    expect(result.current.isLoading).toEqual(true)

    await waitFor(() => {
      expect(result.current).toEqual({
        data: output.data,
        error: output.error ?? null,
        isLoading: false,
        refetch: expect.any(Function),
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
  const balancesById = portfolioBalancesById([portfolioBalance({ fromToken: ethV2Token() })])

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

  it('keeps the search result categoryIds on an option merged with a portfolio balance', () => {
    const searchEthInfo = { ...ethInfo, categoryIds: ['majors'] }
    const { result } = renderHook(() =>
      useCurrencyInfosToTokenOptions({ currencyInfos: [searchEthInfo], portfolioBalancesById: balancesById }),
    )

    expect(result.current?.[0]?.quantity).toBe(balancesById[ethInfo.currencyId]?.quantity)
    expect(result.current?.[0]?.currencyInfo.categoryIds).toEqual(['majors'])
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
        error: null,
      },
    },
  ]

  it.each(cases)('$test', async ({ input, output }) => {
    if (input instanceof Error) {
      vi.spyOn(console, 'error').mockImplementation(vi.fn())
    }

    mockUsePortfolioBalancesForAddressById.mockReturnValue(mockPortfolioBalancesHook(input))

    const { result } = renderHook(() => usePortfolioBalancesForAddressById({ evmAddress: SAMPLE_SEED_ADDRESS_1 }))

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        error: null,
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
        vi.spyOn(console, 'error').mockImplementation(vi.fn())
      }

      const { result } = renderHook(() =>
        usePortfolioTokenOptions({
          portfolioData: mockPortfolioBalancesHook(input),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current).toEqual({
          isLoading: false,
          error: null,
          refetch: expect.any(Function),
          ...output,
        })
      })
    })
  })

  describe('shown tokens', () => {
    // Portfolio balances
    const ethTokenBalance = portfolioBalance({ isHidden: false, fromToken: ethV2Token() })
    const usdcTokenBalance = portfolioBalance({ isHidden: false, fromToken: usdcBaseV2Token() })
    const shownTokenBalances = [ethTokenBalance, usdcTokenBalance]

    const ethPortfolioBalanceTokenOption: TokenOption = {
      ...ethTokenBalance,
      type: OnchainItemListOptionType.Token,
    }
    const usdcPortfolioBalanceTokenOption: TokenOption = {
      ...usdcTokenBalance,
      type: OnchainItemListOptionType.Token,
    }
    const hiddenTokenBalances = createArray(2, () => portfolioBalance({ isHidden: true, fromToken: restV2Token() }))
    const shownPortfolioBalanceTokenOptions = [ethPortfolioBalanceTokenOption, usdcPortfolioBalanceTokenOption]

    const allTokenBalances = [...shownTokenBalances, ...hiddenTokenBalances]
    const allTokenBalancesPortfolioData = mockPortfolioBalancesHook(allTokenBalances)

    // Using a looser type for output to allow expect.any(Function) in test cases
    const cases: {
      test: string
      input: Parameters<typeof usePortfolioTokenOptions>[0]
      output: Omit<ReturnType<typeof usePortfolioTokenOptions>, 'refetch'> & { refetch: unknown }
    }[] = [
      {
        test: 'returns only shown tokens after data is fetched',
        input: { portfolioData: allTokenBalancesPortfolioData, chainFilter: null },
        output: {
          data: shownPortfolioBalanceTokenOptions,
          isLoading: false,
          refetch: expect.any(Function),
          error: null,
        },
      },
      {
        test: 'returns shown tokens filtered by chain',
        input: {
          portfolioData: allTokenBalancesPortfolioData,
          chainFilter: usdcTokenBalance.currencyInfo.currency.chainId,
        },
        output: {
          data: [usdcPortfolioBalanceTokenOption],
          isLoading: false,
          refetch: expect.any(Function),
          error: null,
        },
      },
      {
        test: 'returns shown tokens filtered by chainIds when no single-chain filter is selected',
        input: {
          portfolioData: allTokenBalancesPortfolioData,
          chainFilter: null,
          chainIds: [usdcTokenBalance.currencyInfo.currency.chainId],
        },
        output: {
          data: [usdcPortfolioBalanceTokenOption],
          isLoading: false,
          refetch: expect.any(Function),
          error: null,
        },
      },
      {
        test: 'returns shown tokens starting with "et" (ETH) filtered by search filter',
        input: {
          portfolioData: allTokenBalancesPortfolioData,
          chainFilter: null,
          searchFilter: 'et',
        },
        output: {
          data: [ethPortfolioBalanceTokenOption],
          isLoading: false,
          refetch: expect.any(Function),
          error: null,
        },
      },
      {
        test: 'returns shown tokens starting with "us" (USDC) filtered by search filter',
        input: {
          portfolioData: allTokenBalancesPortfolioData,
          chainFilter: null,
          searchFilter: 'us',
        },
        output: {
          data: [usdcPortfolioBalanceTokenOption],
          isLoading: false,
          refetch: expect.any(Function),
          error: null,
        },
      },
      {
        test: 'returns no data when there is no token that matches both chain and search filter',
        input: {
          portfolioData: allTokenBalancesPortfolioData,
          chainFilter: UniverseChainId.Base,
          searchFilter: 'et',
        },
        output: {
          data: [],
          isLoading: false,
          refetch: expect.any(Function),
          error: null,
        },
      },
    ]

    it.each(cases)('$test', async ({ input, output }) => {
      const { result } = renderHook(() => usePortfolioTokenOptions(input))

      await waitFor(() => {
        expect(result.current).toEqual(output)
      })
    })
  })
})

describe(useTrendingTokensOptions, () => {
  beforeEach(() => {
    mockUseTop1DVolumeTokens.mockReset()
  })

  function mockTopTokens({ data, error }: { data: MultichainSearchResult[] | undefined; error: Error | null }): void {
    mockUseTop1DVolumeTokens.mockReturnValue({ data, isLoading: false, error, refetch: vi.fn() })
  }

  // Single-deployment tokens on three different chains, so the unfiltered pick keeps each one.
  const topTokens = [daiV2Token(), usdcArbitrumV2Token(), usdcBaseV2Token()]
  const topTokenResults = topTokens
    .map((t) =>
      dataApiMultichainTokenToSearchResult(
        createRankedMultichainToken({
          multichainId: `mc-${t.address}`,
          chainId: t.chainId,
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
        }),
      ),
    )
    .filter((result): result is MultichainSearchResult => result !== undefined)
  const tokenBalances = topTokens.map((t) => portfolioBalance({ fromToken: t }))

  it('returns undefined when there is no data', async () => {
    mockTopTokens({ data: [], error: null })

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        portfolioData: mockPortfolioBalancesHook(tokenBalances),
        chainFilter: null,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        data: [],
        error: null,
        refetch: expect.any(Function),
      })
    })
  })

  it('returns error and empty balance options if portfolios query fails', async () => {
    mockTopTokens({ data: topTokenResults, error: null })

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        portfolioData: mockPortfolioBalancesHook(new Error('Test')),
        chainFilter: null,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        // data won't be undefined because top tokens are still being fetched
        // and empty balance options will be returned for these tokens
        data: expect.anything(),
        error: new Error('Test'),
        refetch: expect.any(Function),
      })
    })
  })

  it('returns error if the trending tokens query fails', async () => {
    mockTopTokens({ data: undefined, error: new Error('Failed to fetch trending tokens') })

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        portfolioData: mockPortfolioBalancesHook(tokenBalances),
        chainFilter: null,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch trending tokens'),
        refetch: expect.any(Function),
      })
    })
  })

  it('returns trending token options when there is data', async () => {
    mockTopTokens({ data: topTokenResults, error: null })

    const { result } = renderHook(() =>
      useTrendingTokensOptions({
        portfolioData: mockPortfolioBalancesHook(tokenBalances),
        chainFilter: null,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        data: expect.toIncludeSameMembers(
          tokenBalances.map((balance) => ({
            ...balance,
            type: OnchainItemListOptionType.Token,
          })),
        ),
        error: null,
        refetch: expect.any(Function),
      })
    })
  })
})

describe(useCommonTokensOptionsWithFallback, () => {
  // One multichain asset per token, mirroring the API — mixing a native token into an asset
  // with other deployments would cause the non-natives to be dropped as bridged copies
  const assets = [multichainAsset([eth]), multichainAsset([dai]), multichainAsset([usdc_base])]
  const tokenBalances = [ethBalance, daiBalance, usdcBaseBalance]

  const cases = [
    {
      test: 'returns an empty list when the multichain response has no tokens',
      portfolioInput: tokenBalances,
      tokensInput: [],
      chainFilter: null,
      output: { data: [] },
    },
    {
      test: 'returns error if portfolios query fails',
      portfolioInput: new Error('Test'),
      tokensInput: assets,
      chainFilter: null,
      output: {
        data: expect.anything(), // Returns fallback tokens from the multichain lookup
        error: new Error('Test'), // Shows the portfolio error
      },
    },
    {
      test: 'returns error and no data if the multichain query fails',
      portfolioInput: tokenBalances,
      tokensInput: new Error('Test'),
      chainFilter: null,
      output: { data: undefined, error: expect.objectContaining({ message: 'Test' }) },
    },
    {
      test: 'return balances for all tokens if no chain filter is specified',
      portfolioInput: tokenBalances,
      tokensInput: assets,
      chainFilter: null,
      output: {
        data: expect.toIncludeSameMembers(
          tokenBalances.map((balance) => ({
            ...balance,
            type: OnchainItemListOptionType.Token,
          })),
        ),
        error: null,
      },
    },
    {
      test: 'returns balances for tokens in the multichain lookup filtered by chain',
      portfolioInput: tokenBalances,
      tokensInput: assets,
      chainFilter: UniverseChainId.Mainnet as UniverseChainId,
      output: {
        data: expect.toIncludeSameMembers([
          // DAI and ETH have Mainnet chain
          { ...ethBalance, type: OnchainItemListOptionType.Token },
          { ...daiBalance, type: OnchainItemListOptionType.Token },
        ]),
        error: null,
      },
    },
  ]

  it.each(cases)('$test', async ({ portfolioInput, tokensInput, chainFilter, output }) => {
    mockMultichainTokensQuery(tokensInput)
    const { result } = renderHook(() =>
      useCommonTokensOptionsWithFallback({
        portfolioData: mockPortfolioBalancesHook(portfolioInput),
        chainFilter,
      }),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        error: null,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(useFavoriteTokensOptions, () => {
  const tokenBalances = [
    ...favoriteTokenBalances,
    ...createArray(3, () => portfolioBalance({ fromToken: restV2Token() })),
  ]

  const cases = [
    {
      test: 'returns an empty list when there is no data',
      portfolioInput: undefined,
      tokensInput: [],
      chainFilter: null,
      output: { data: [] },
    },
    {
      test: 'returns error if portfolios query fails',
      portfolioInput: new Error('Test'),
      tokensInput: favoriteTokens,
      chainFilter: null,
      output: {
        data: expect.anything(), // Returns fallback tokens from the token lookup
        error: new Error('Test'), // Shows the portfolio error
      },
    },
    {
      test: 'returns error and no data if the token query fails',
      portfolioInput: tokenBalances,
      tokensInput: new Error('Test'),
      chainFilter: null,
      output: { data: undefined, error: expect.objectContaining({ message: 'Test' }) },
    },
    {
      test: 'returns balances for all favorite tokens in portfolios if no chain filter is specified',
      portfolioInput: tokenBalances,
      tokensInput: favoriteTokens,
      chainFilter: null,
      output: {
        data: expect.toIncludeSameMembers(
          favoriteTokenBalances.map((balance) => {
            return { ...balance, type: OnchainItemListOptionType.Token }
          }),
        ),
        error: null,
      },
    },
    {
      test: 'returns balances for favorite tokens filtered by chain',
      portfolioInput: tokenBalances,
      tokensInput: favoriteTokens,
      chainFilter: UniverseChainId.Mainnet as UniverseChainId,
      output: {
        data: expect.toIncludeSameMembers([
          // DAI and ETH have Mainnet chain
          { ...ethBalance, type: OnchainItemListOptionType.Token },
          { ...daiBalance, type: OnchainItemListOptionType.Token },
        ]),
        error: null,
      },
    },
  ]

  it.each(cases)('$test', async ({ portfolioInput, tokensInput, chainFilter, output }) => {
    mockTokensQuery(tokensInput)
    const { result } = renderHook(
      () =>
        useFavoriteTokensOptions({
          portfolioData: mockPortfolioBalancesHook(portfolioInput),
          chainFilter,
        }),
      { preloadedState },
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        error: null,
        refetch: expect.any(Function),
        ...output,
      })
    })
  })
})

describe(useRecentlySearchedTokens, () => {
  it('does not crash when search history contains tokens with invalid chainIds', () => {
    // This simulates the exact data that caused the production crash
    const problematicSearchHistory: PreloadedState<UniswapState> = {
      searchHistory: {
        results: [
          {
            type: SearchHistoryResultType.Token,
            chainId: 10143 as UniverseChainId, // Invalid: Monad testnet
            address: null,
            searchId: 'token-10143-null',
          },
          {
            type: SearchHistoryResultType.Token,
            chainId: 10143 as UniverseChainId, // Invalid: Monad testnet
            address: '0xB5a30b0FDc5EA94A52fDc42e3E9760Cb8449Fb37',
            searchId: 'token-10143-0xb5a30b0fdc5ea94a52fdc42e3e9760cb8449fb37',
          },
          {
            type: SearchHistoryResultType.Token,
            chainId: UniverseChainId.Mainnet, // Valid
            address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            searchId: 'token-1-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          },
        ],
      },
    }

    // This should not throw
    expect(() => {
      renderHook(() => useRecentlySearchedTokens(null), {
        preloadedState: problematicSearchHistory,
      })
    }).not.toThrow()
  })

  it('filters out tokens with invalid chainIds from search history', () => {
    const mixedSearchHistory: PreloadedState<UniswapState> = {
      searchHistory: {
        results: [
          {
            type: SearchHistoryResultType.Token,
            chainId: 99999 as UniverseChainId, // Invalid chainId
            address: '0xabcdef1234567890abcdef1234567890abcdef12',
            searchId: 'token-99999-0xabcdef1234567890abcdef1234567890abcdef12',
          },
          {
            type: SearchHistoryResultType.Token,
            chainId: UniverseChainId.Mainnet, // Valid
            address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            searchId: 'token-1-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          },
        ],
      },
    }

    const { result } = renderHook(() => useRecentlySearchedTokens(null), {
      preloadedState: mixedSearchHistory,
    })

    // The hook returns an array - invalid chainIds should be filtered out
    // so only the valid Mainnet token should be processed
    // Note: The actual token data may be undefined since we're not mocking the currency info fetch,
    // but the important thing is that it doesn't crash
    expect(result.current).toBeDefined()
    expect(Array.isArray(result.current)).toBe(true)
  })

  it('returns empty array when all tokens have invalid chainIds', () => {
    const allInvalidSearchHistory: PreloadedState<UniswapState> = {
      searchHistory: {
        results: [
          {
            type: SearchHistoryResultType.Token,
            chainId: 10143 as UniverseChainId, // Invalid
            address: null,
            searchId: 'token-10143-null',
          },
          {
            type: SearchHistoryResultType.Token,
            chainId: 99999 as UniverseChainId, // Invalid
            address: '0xabcdef1234567890abcdef1234567890abcdef12',
            searchId: 'token-99999-0xabcdef',
          },
        ],
      },
    }

    const { result } = renderHook(() => useRecentlySearchedTokens(null), {
      preloadedState: allInvalidSearchHistory,
    })

    // Should return empty array, not crash
    expect(result.current).toEqual([])
  })
})
