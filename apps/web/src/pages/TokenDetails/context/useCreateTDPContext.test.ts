import { NetworkStatus } from '@apollo/client'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useLocation, useParams } from 'react-router'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import type { RWAWhitelist } from 'uniswap/src/features/rwa/types'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCreateTDPContext } from '~/pages/TokenDetails/context/useCreateTDPContext'
import { mocked } from '~/test-utils/mocked'
import { renderHook as renderHookWithProviders, waitFor } from '~/test-utils/render'
import { createMockTDPChartState } from '~/test-utils/tokenDetails/fixtures'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const restMocks = vi.hoisted(() => ({
  // Salted per test so the module-level test QueryClient can't serve one test's cache to the next
  querySalt: 0,
  getTokenQueryFn: vi.fn(),
  getTokenMultiChainQueryFn: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', () => ({
  getGetTokenQueryOptions: ({ params, enabled }: { params?: unknown; enabled?: boolean }) => ({
    queryKey: ['test-tdp', restMocks.querySalt, 'getToken', params],
    queryFn: restMocks.getTokenQueryFn,
    enabled,
    retry: false,
  }),
  getGetTokenMultiChainQueryOptions: ({ params, enabled }: { params?: unknown; enabled?: boolean }) => ({
    queryKey: ['test-tdp', restMocks.querySalt, 'getTokenMultiChain', params],
    queryFn: restMocks.getTokenMultiChainQueryFn,
    enabled,
    retry: false,
  }),
}))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
  }
})

vi.mock('@universe/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/api')>()
  return {
    ...actual,
    GraphQLApi: {
      ...actual.GraphQLApi,
      useTokenWebQuery: vi.fn(),
      useTokenProjectWebQuery: vi.fn(),
    },
  }
})

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(() => false),
  }
})

vi.mock('uniswap/src/features/rwa/useRWAWhitelist', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('uniswap/src/features/rwa/useRWAWhitelist')>()),
    useRWAWhitelist: vi.fn(() => []),
  }
})

vi.mock('~/utils/params/chainParams', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/params/chainParams')>()
  return {
    ...actual,
    useChainIdFromUrlParam: vi.fn(() => UniverseChainId.Mainnet),
  }
})

const mockChartState = createMockTDPChartState()

vi.mock('~/pages/TokenDetails/components/chart/TDPChartState', () => ({
  useCreateTDPChartState: vi.fn(() => mockChartState),
}))

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return {
    ...actual,
    useSporeColors: vi.fn(() => ({ surface2: { val: '#000000' } })),
  }
})

vi.mock('~/hooks/useColor', () => ({
  useSrcColor: vi.fn(() => ({ tokenColor: undefined })),
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(() => ({ evmAddress: undefined, svmAddress: undefined })),
  useActiveWallet: vi.fn(() => undefined),
  useConnectionStatus: vi.fn(() => ({
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  })),
}))

vi.mock('uniswap/src/features/portfolio/balances/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/portfolio/balances/hooks')>()
  return {
    ...actual,
    usePortfolioBalances: vi.fn(() => ({ data: undefined, error: undefined })),
  }
})

// What Apollo reports on a warm-cache remount under the app-wide `cache-and-network` watchQuery
// default (apps/web/src/data/apollo/client.ts): a fresh ObservableQuery starts in the loading
// state and revalidates, but the cached data is already there.
function warmCacheRevalidating(token: unknown) {
  return {
    data: { token },
    loading: true,
    networkStatus: NetworkStatus.loading,
    error: undefined,
  } as ReturnType<typeof GraphQLApi.useTokenWebQuery>
}

/** Same cached payload after the background revalidation resolves. */
function revalidated(token: unknown) {
  return {
    data: { token },
    loading: false,
    networkStatus: NetworkStatus.ready,
    error: undefined,
  } as ReturnType<typeof GraphQLApi.useTokenWebQuery>
}

/** True when a render that had already stopped loading went back to loading — a skeleton bounce. */
function bouncedBackToSkeleton(loadingStates: boolean[]): boolean {
  const firstRendered = loadingStates.indexOf(false)
  return firstRendered !== -1 && loadingStates.lastIndexOf(true) > firstRendered
}

describe('useCreateTDPContext', () => {
  beforeEach(() => {
    restMocks.querySalt += 1
    restMocks.getTokenQueryFn.mockReset()
    restMocks.getTokenMultiChainQueryFn.mockReset()
    mocked(useFeatureFlag).mockImplementation(() => false)
    mocked(useParams).mockReturnValue({
      tokenAddress: USDC_MAINNET.address,
      chainName: 'ethereum',
    })
    mocked(useLocation).mockReturnValue({
      pathname: '/explore/tokens/ethereum/0x123',
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>)
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: validTokenProjectResponse.data,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)
    // `currency`, `multiChainMap` and `tokenColor` now derive from the lightweight metadata query.
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue({
      data: validTokenProjectResponse.data,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>)
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof usePortfolioBalances>)
  })

  it('throws when tokenAddress URL param is undefined', () => {
    mocked(useParams).mockReturnValue({
      tokenAddress: undefined,
      chainName: 'ethereum',
    })

    expect(() => renderHookWithProviders(() => useCreateTDPContext())).toThrow(
      'Invalid token details route: token address URL param is undefined',
    )
  })

  it('returns object with required TDP context keys', () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state).toMatchObject({
      currency: expect.anything(),
      currencyChain: GraphQLApi.Chain.Ethereum,
      currencyChainId: UniverseChainId.Mainnet,
      address: expect.any(String),
      tokenQuery: expect.anything(),
      tokenProjectQuery: expect.anything(),
      multiChainMap: expect.any(Object),
      balanceError: undefined,
      selectedMultichainChainId: undefined,
    })
    expect(Object.keys(result.current.state)).toContain('tokenColor')
  })

  it('returns PendingTDPContext (currency undefined) when token query has no data', () => {
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
    expect(result.current.state.tokenQuery.loading).toBe(true)
    expect(result.current.state.tokenProjectQuery.loading).toBe(true)
  })

  it('returns LoadedTDPContext (currency defined) when token query has data', () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeDefined()
    expect(result.current.state.currency?.symbol).toBe('USDC')
    expect(result.current.state.currency?.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
  })

  it('returns native currency when tokenAddress is NATIVE_CHAIN_ID', () => {
    mocked(useParams).mockReturnValue({
      tokenAddress: NATIVE_CHAIN_ID,
      chainName: 'ethereum',
    })
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeDefined()
    expect(result.current.state.currency?.isNative).toBe(true)
    expect(result.current.state.address).toBe(NATIVE_CHAIN_ID)
  })

  it('exposes the raw balance query error for stale balance UI decisions', () => {
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
    } as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.balanceError).toEqual(expect.any(Error))
  })

  it('skips balance refetch when the portfolio is loaded and empty', () => {
    const refetch = vi.fn()
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: {},
      error: undefined,
      refetch,
    } as unknown as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())
    result.current.balancesRefetch()

    expect(refetch).not.toHaveBeenCalled()
  })

  it('refetches balances when the portfolio has holdings', () => {
    const refetch = vi.fn()
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: { '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {} },
      error: undefined,
      refetch,
    } as unknown as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())
    result.current.balancesRefetch()

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('refetches balances while the portfolio has not loaded yet', () => {
    const refetch = vi.fn()
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: undefined,
      refetch,
    } as unknown as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())
    result.current.balancesRefetch()

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('adapts GraphQL data onto the V2-shaped token and multichainToken when the flag is off', () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.token).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: USDC_MAINNET.address,
      symbol: 'USDC',
      name: 'USD Coin',
    })
    // Fixture has no project.tokens rows, so the multichain source hasn't resolved cross-chain data
    expect(result.current.state.multichainToken).toBeUndefined()
    expect(result.current.state.multichainTokenLoaded).toBe(false)
    expect(result.current.state.pageQueryLoading).toBe(false)
    expect(result.current.state.marketDataLoading).toBe(false)
    // REST queries stay disabled
    expect(restMocks.getTokenQueryFn).not.toHaveBeenCalled()
    expect(restMocks.getTokenMultiChainQueryFn).not.toHaveBeenCalled()
  })
})

describe('useCreateTDPContext with V2EndpointsTokens enabled', () => {
  const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

  const restToken = {
    chainId: UniverseChainId.Mainnet,
    address: USDC_MAINNET.address,
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    type: 2,
    price: { spotUsd: 1.0001 },
    safety: { isSpam: false, isVerified: true, isBlocked: false, features: [] },
    fees: undefined,
    project: { logoUrl: 'https://example.com/logo.png', descriptionTranslations: {} },
    multichain: undefined,
  }

  // Matches the page token, so findRWAMatch resolves a match off the REST-derived candidates.
  const RWA_WHITELIST: RWAWhitelist = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      icon: 'https://example.com/usdc.png',
      tokens: [
        {
          chainId: UniverseChainId.Mainnet,
          address: USDC_MAINNET.address,
          issuer: 'ondo',
          name: 'Ondo',
          symbol: 'USDC.on',
          logoUrl: 'https://example.com/usdc-ondo.png',
        },
      ],
      category: RwaCategory.STOCKS,
    },
  ]

  const restMultichainToken = {
    multichainId: 'mc-usdc',
    addresses: {
      [String(UniverseChainId.Mainnet)]: USDC_MAINNET.address,
      [String(UniverseChainId.Base)]: USDC_BASE_ADDRESS,
    },
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    type: 2,
  }

  beforeEach(() => {
    restMocks.querySalt += 1
    restMocks.getTokenQueryFn.mockReset().mockResolvedValue({ token: restToken })
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({ token: restMultichainToken })
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.V2EndpointsTokens)
    mocked(useRWAWhitelist).mockReturnValue([])
    mocked(useParams).mockReturnValue({
      tokenAddress: USDC_MAINNET.address.toLowerCase(),
      chainName: 'ethereum',
    })
    mocked(useLocation).mockReturnValue({
      pathname: '/explore/tokens/ethereum/0x123',
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>)
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>)
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof usePortfolioBalances>)
  })

  it('skips both GraphQL queries and derives the context from REST', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(GraphQLApi.useTokenProjectWebQuery).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
    expect(GraphQLApi.useTokenWebQuery).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    expect(result.current.state.currency?.symbol).toBe('USDC')
    expect(result.current.state.currency?.chainId).toBe(UniverseChainId.Mainnet)
    // checksummed via the REST-derived currency even though the URL param was lowercase
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
    expect(result.current.state.token).toEqual(restToken)
    expect(result.current.state.multichainToken).toEqual(restMultichainToken)
  })

  // The sole exception to the skip above, so the only way `tokenQuery.data` survives a global flag-on —
  // which is what keeps StatsSection's legacy marketCap/FDV fill from shadowing V2. Pinned here because
  // StatsSection reads only the effective flag and can't tell the two states apart.
  it('keeps the TokenWeb query alive for RWA project market data even with the V2 flag on', async () => {
    mocked(useFeatureFlag).mockImplementation(
      (flag) => flag === FeatureFlags.V2EndpointsTokens || flag === FeatureFlags.RWACoinGeckoData,
    )
    mocked(useRWAWhitelist).mockReturnValue(RWA_WHITELIST)

    renderHookWithProviders(() => useCreateTDPContext())

    // The RWA candidates derive from the REST response, so the carve-out engages once GetToken resolves.
    await waitFor(() => {
      expect(GraphQLApi.useTokenWebQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          skip: false,
          variables: expect.objectContaining({ preferProjectMarketData: true }),
        }),
      )
    })
  })

  it('requests GetToken with the cache-normalized URL address (same key the shared hooks build)', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    expect(restMocks.getTokenQueryFn).toHaveBeenCalled()
    const getTokenCall = restMocks.getTokenQueryFn.mock.calls[0]?.[0] as { queryKey: unknown[] }
    expect(getTokenCall.queryKey).toContainEqual({
      chainId: UniverseChainId.Mainnet,
      address: USDC_MAINNET.address.toLowerCase(),
    })
  })

  it('builds multiChainMap from the multichain addresses map', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multiChainMap).toEqual({
      [GraphQLApi.Chain.Ethereum]: { address: USDC_MAINNET.address, balance: undefined },
      [GraphQLApi.Chain.Base]: { address: USDC_BASE_ADDRESS, balance: undefined },
    })
  })

  it('matches portfolio balances to checksummed REST addresses despite lowercase balance ids', async () => {
    const mainnetBalance = { quantity: 100 }
    const baseBalance = { quantity: 25 }
    vi.mocked(usePortfolioBalances).mockReturnValue({
      // REST portfolio balances are keyed by lowercase currency ids; GetTokenMultiChain
      // addresses are checksummed — the map must still associate them.
      data: {
        [`${UniverseChainId.Mainnet}-${USDC_MAINNET.address.toLowerCase()}`]: mainnetBalance,
        [`${UniverseChainId.Base}-${USDC_BASE_ADDRESS.toLowerCase()}`]: baseBalance,
      },
      error: undefined,
    } as unknown as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multiChainMap).toEqual({
      [GraphQLApi.Chain.Ethereum]: { address: USDC_MAINNET.address, balance: mainnetBalance },
      [GraphQLApi.Chain.Base]: { address: USDC_BASE_ADDRESS, balance: baseBalance },
    })
  })

  it('synthesizes a single-chain multichainToken when GetTokenMultiChain errors', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockRejectedValue(new Error('not_found'))

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multichainToken).toMatchObject({
      addresses: { [String(UniverseChainId.Mainnet)]: USDC_MAINNET.address },
    })
    expect(result.current.state.multiChainMap).toEqual({
      [GraphQLApi.Chain.Ethereum]: { address: USDC_MAINNET.address, balance: undefined },
    })
  })

  it('stays pending (no redirect-eligible state) while GetToken is loading', () => {
    restMocks.getTokenQueryFn.mockReset().mockReturnValue(new Promise(() => {}))
    restMocks.getTokenMultiChainQueryFn.mockReset().mockReturnValue(new Promise(() => {}))

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.pageQueryLoading).toBe(true)
    expect(result.current.state.chainDataLoading).toBe(true)
    expect(result.current.state.multichainTokenLoaded).toBe(false)
  })

  it('resolves currency undefined after GetToken not_found so the page can redirect', async () => {
    restMocks.getTokenQueryFn.mockReset().mockRejectedValue(new Error('not_found'))
    restMocks.getTokenMultiChainQueryFn.mockReset().mockRejectedValue(new Error('not_found'))

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.pageQueryLoading).toBe(false)
    })

    expect(result.current.state.currency).toBeUndefined()
  })
})

describe('useCreateTDPContext on a Robinhood chain with V2EndpointsTokens disabled', () => {
  const legacyToken = validTokenProjectResponse.data?.token

  // Logo + every headline stat present, so `isLegacyTdpDataMissing` is false and the V2 fallback
  // stays dormant. The bare fixture is missing market stats, which would silently arm the fallback.
  const completeMarketToken = {
    ...legacyToken,
    market: {
      totalValueLocked: { value: 1_000_000 },
      volume24H: { value: 500_000 },
      priceHigh52W: { value: 1.02 },
      priceLow52W: { value: 0.98 },
    },
    project: {
      ...legacyToken?.project,
      markets: [{ marketCap: { value: 42_000_000 }, fullyDilutedValuation: { value: 45_000_000 } }],
    },
  }

  // Logo stripped: `isLegacyTdpDataMissing` fires, so the fallback is genuinely active on this one.
  const incompleteMetadataToken = {
    ...legacyToken,
    project: { ...legacyToken?.project, logoUrl: undefined },
  }

  const robinhoodRestToken = {
    chainId: UniverseChainId.Robinhood,
    address: USDC_MAINNET.address,
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    type: 2,
    price: { spotUsd: 1.0001 },
    safety: { isSpam: false, isVerified: true, isBlocked: false, features: [] },
    fees: undefined,
    project: { logoUrl: 'https://example.com/rest-logo.png', descriptionTranslations: {} },
    multichain: undefined,
  }

  beforeEach(() => {
    restMocks.querySalt += 1
    // Robinhood prefetches the V2 endpoints; leave them unresolved so only the legacy source can
    // satisfy the page — the loading flags must come from the cached GraphQL data alone.
    restMocks.getTokenQueryFn.mockReset().mockReturnValue(new Promise(() => {}))
    restMocks.getTokenMultiChainQueryFn.mockReset().mockReturnValue(new Promise(() => {}))
    mocked(useFeatureFlag).mockImplementation(() => false)
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Robinhood)
    mocked(useParams).mockReturnValue({
      tokenAddress: USDC_MAINNET.address,
      chainName: 'robinhood',
    })
    mocked(useLocation).mockReturnValue({
      pathname: '/explore/tokens/robinhood/0x123',
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>)
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof usePortfolioBalances>)
  })

  afterEach(() => {
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Mainnet)
  })

  it('renders straight from the warm Apollo cache instead of re-skeletoning on remount', async () => {
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(warmCacheRevalidating(legacyToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(warmCacheRevalidating(completeMarketToken))

    const { result, rerender } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    expect(result.current.state.pageQueryLoading).toBe(false)
    expect(result.current.state.chainDataLoading).toBe(false)
    expect(result.current.state.marketDataLoading).toBe(false)
    expect(result.current.isV2TokensEnabled).toBe(false)

    // Drive the background revalidation to completion — the cached legacy data is complete, so the
    // source must stay legacy and the page must stay rendered.
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(revalidated(legacyToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(revalidated(completeMarketToken))
    rerender()

    expect(result.current.state.pageQueryLoading).toBe(false)
    expect(result.current.isV2TokensEnabled).toBe(false)
  })

  it('commits with the V2 source on a warm remount when the cached legacy data is incomplete', async () => {
    restMocks.getTokenQueryFn.mockReset().mockResolvedValue({ token: robinhoodRestToken })
    restMocks.getTokenMultiChainQueryFn.mockReset().mockRejectedValue(new Error('not_found'))
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(warmCacheRevalidating(incompleteMetadataToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(warmCacheRevalidating(completeMarketToken))

    const sources: boolean[] = []
    const { result, rerender } = renderHookWithProviders(() => {
      const context = useCreateTDPContext()
      sources.push(context.isV2TokensEnabled)
      return context
    })

    await waitFor(() => {
      expect(result.current.state.pageQueryLoading).toBe(false)
    })

    expect(result.current.isV2TokensEnabled).toBe(true)
    expect(result.current.state.token).toEqual(robinhoodRestToken)

    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(revalidated(incompleteMetadataToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(revalidated(completeMarketToken))
    rerender()

    expect(result.current.isV2TokensEnabled).toBe(true)
    // Never rendered from legacy first: no visible source swap across the revalidation.
    expect(sources).not.toContain(false)
  })

  it('does not bounce back to the skeleton when the fallback resolves with GetToken still cold', async () => {
    // GetToken stays unresolved (block default), so a source swap after revalidation would drop the
    // populated page back to a skeleton while V2 loads.
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(warmCacheRevalidating(incompleteMetadataToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(warmCacheRevalidating(completeMarketToken))

    const loadingStates: boolean[] = []
    const sources: boolean[] = []
    const { result, rerender } = renderHookWithProviders(() => {
      const context = useCreateTDPContext()
      loadingStates.push(context.state.pageQueryLoading)
      sources.push(context.isV2TokensEnabled)
      return context
    })

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(revalidated(incompleteMetadataToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(revalidated(completeMarketToken))
    rerender()

    expect(bouncedBackToSkeleton(loadingStates)).toBe(false)
    expect(sources).not.toContain(false)
    // Legacy is known-incomplete and V2 has not landed, so there is nothing trustworthy to paint:
    // the skeleton is held from the first render rather than dropped onto a populated page.
    expect(loadingStates).not.toContain(false)
  })

  it('holds the skeleton on a cold load until both legacy queries resolve', async () => {
    // Metadata landed, market query still in flight with nothing cached — the fallback decision is
    // genuinely undecided, so the page must not commit yet (#37405).
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue({
      data: validTokenProjectResponse.data,
      loading: false,
      networkStatus: NetworkStatus.ready,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>)
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: undefined,
      loading: true,
      networkStatus: NetworkStatus.loading,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.pageQueryLoading).toBe(true)
    })

    expect(result.current.state.chainDataLoading).toBe(true)
    expect(result.current.state.marketDataLoading).toBe(true)
  })
})

// The data-gated loading reads are not Robinhood-scoped: with the V2 flag off, every chain now
// takes `pageQueryLoading` / `chainDataLoading` from `legacyMetadataPending` instead of raw Apollo
// `loading`. Mainnet is the highest-traffic case, and the Robinhood fallback is inert here.
describe('useCreateTDPContext on a non-Robinhood chain with V2EndpointsTokens disabled', () => {
  const legacyToken = validTokenProjectResponse.data?.token

  beforeEach(() => {
    restMocks.querySalt += 1
    // Off Robinhood with the flag off, the V2 endpoints are never enabled — leave them unresolved
    // so nothing but the cached GraphQL data can satisfy the page.
    restMocks.getTokenQueryFn.mockReset().mockReturnValue(new Promise(() => {}))
    restMocks.getTokenMultiChainQueryFn.mockReset().mockReturnValue(new Promise(() => {}))
    mocked(useFeatureFlag).mockImplementation(() => false)
    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Mainnet)
    mocked(useParams).mockReturnValue({
      tokenAddress: USDC_MAINNET.address,
      chainName: 'ethereum',
    })
    mocked(useLocation).mockReturnValue({
      pathname: '/explore/tokens/ethereum/0x123',
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>)
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof usePortfolioBalances>)
  })

  it('renders straight from the warm Apollo cache on remount and stays rendered across revalidation', async () => {
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(warmCacheRevalidating(legacyToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(warmCacheRevalidating(legacyToken))

    const loadingStates: boolean[] = []
    const { result, rerender } = renderHookWithProviders(() => {
      const context = useCreateTDPContext()
      loadingStates.push(context.state.pageQueryLoading)
      return context
    })

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    // Cache is warm and only a background revalidate is in flight: nothing may report loading.
    expect(result.current.state.pageQueryLoading).toBe(false)
    expect(result.current.state.chainDataLoading).toBe(false)
    // The bare fixture carries no market stats, but the fallback is Robinhood-only — the source
    // must stay legacy here regardless of how incomplete the cached data is.
    expect(result.current.isV2TokensEnabled).toBe(false)

    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue(revalidated(legacyToken))
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue(revalidated(legacyToken))
    rerender()

    expect(result.current.state.pageQueryLoading).toBe(false)
    expect(result.current.state.chainDataLoading).toBe(false)
    expect(result.current.isV2TokensEnabled).toBe(false)
    expect(bouncedBackToSkeleton(loadingStates)).toBe(false)
    expect(loadingStates).not.toContain(true)
  })
})
