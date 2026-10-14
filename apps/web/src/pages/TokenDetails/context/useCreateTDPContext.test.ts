import type { PlainMessage } from '@bufbuild/protobuf'
import { Code, ConnectError } from '@connectrpc/connect'
import { keepPreviousData } from '@tanstack/react-query'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { GraphQLApi } from '@universe/api'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { useFeatureFlag } from '@universe/gating'
import { useLocation, useParams } from 'react-router'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useCreateTDPContext } from '~/pages/TokenDetails/context/useCreateTDPContext'
import { useTokenDetailsAuction } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { mocked } from '~/test-utils/mocked'
import { renderHook as renderHookWithProviders, waitFor } from '~/test-utils/render'
import { createMockTDPChartState } from '~/test-utils/tokenDetails/fixtures'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

const restMocks = vi.hoisted(() => ({
  // Salted per test so the module-level test QueryClient can't serve one test's cache to the next
  querySalt: 0,
  getTokenMultiChainQueryFn: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()
  return {
    ...actual,
    getGetTokenMultiChainQueryOptions: ({ params, enabled }: { params?: unknown; enabled?: boolean }) => ({
      queryKey: ['test-tdp', restMocks.querySalt, 'getTokenMultiChain', params],
      queryFn: restMocks.getTokenMultiChainQueryFn,
      enabled,
      retry: false,
      // Matches the real query options' policy so navigation tests exercise the same
      // stale-placeholder-during-refetch behavior the production hook has to handle.
      placeholderData: keepPreviousData,
    }),
  }
})

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
  }
})

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(() => false),
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

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
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

vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsAuction', () => ({
  useTokenDetailsAuction: vi.fn(),
}))

beforeEach(() => {
  mocked(useTokenDetailsAuction).mockReturnValue({
    status: TokenDetailsSourceState.Disabled,
  })
})

const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const restMultichainAddresses = {
  [String(UniverseChainId.Mainnet)]: USDC_MAINNET.address,
  [String(UniverseChainId.Base)]: USDC_BASE_ADDRESS,
}

/** Builds the `addresses` + `deployments` pair the v2 backend serves for the same chain set. */
function multichainDeploymentFields(addresses: Record<string, string>): {
  addresses: Record<string, string>
  deployments: Record<string, { address: string; decimals: number }>
} {
  return {
    addresses,
    deployments: Object.fromEntries(
      Object.entries(addresses).map(([chainId, address]) => [chainId, { address, decimals: 6 }]),
    ),
  }
}

const restMultichainToken = {
  multichainId: 'mc-usdc',
  ...multichainDeploymentFields(restMultichainAddresses),
  symbol: 'USDC',
  decimals: 6,
  name: 'USD Coin',
  type: 2,
  price: { spotUsd: 1.0001 },
  safety: { isSpam: false, isVerified: true, isBlocked: false, features: [] },
  fees: undefined,
  project: { logoUrl: 'https://example.com/logo.png', descriptionTranslations: {} },
}

// What useCreateTDPContext derives from restMultichainToken for the current (Mainnet) chain —
// every field carries straight across except the scalar chainId/address pair.
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
  fdv: undefined,
  multichain: { id: 'mc-usdc', addresses: restMultichainAddresses },
}

describe('useCreateTDPContext', () => {
  beforeEach(() => {
    restMocks.querySalt += 1
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({ token: restMultichainToken })
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

  it('returns object with required TDP context keys', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.currency).toBeDefined())

    expect(result.current.state).toMatchObject({
      currency: expect.anything(),
      currencyChain: GraphQLApi.Chain.Ethereum,
      currencyChainId: UniverseChainId.Mainnet,
      address: expect.any(String),
      multiChainMap: expect.any(Object),
      balanceError: undefined,
      selectedMultichainChainId: undefined,
    })
    expect(Object.keys(result.current.state)).toContain('tokenColor')
  })

  it('returns PendingTDPContext (currency undefined) while the token query is in flight', () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockReturnValue(new Promise(() => {}))

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
    expect(result.current.state.pageQueryLoading).toBe(true)
  })

  it('returns LoadedTDPContext (currency defined) when the token query has data', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.currency).toBeDefined())

    expect(result.current.state.currency?.symbol).toBe('USDC')
    expect(result.current.state.currency?.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
    expect(result.current.state.pageQueryLoading).toBe(false)
  })

  it('keeps the canonical page when the auction lookup fails', async () => {
    mocked(useTokenDetailsAuction).mockReturnValue({
      status: TokenDetailsSourceState.Error,
      error: new Error('unavailable'),
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.currency).toBeDefined())

    expect(result.current.state.pageQueryLoading).toBe(false)
    expect(result.current.state.auctionSource.status).toBe(TokenDetailsSourceState.Error)
  })

  it('keeps a found auction as supplemental data when the canonical token is missing', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({ token: undefined })
    mocked(useTokenDetailsAuction).mockReturnValue({
      status: TokenDetailsSourceState.Found,
      auction: { address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>,
      auctions: [{ address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>],
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.pageQueryLoading).toBe(false))

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.auctionSource).toMatchObject({
      status: TokenDetailsSourceState.Found,
      auction: { address: '0x1111111111111111111111111111111111111111' },
      auctions: [{ address: '0x1111111111111111111111111111111111111111' }],
    })
  })

  it('preserves the existing redirect state when auction resolution is disabled', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({ token: undefined })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.pageQueryLoading).toBe(false))

    expect(result.current.state.currency).toBeUndefined()
  })

  it('does not wait for the auction lookup after the canonical token is missing', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({ token: undefined })
    mocked(useTokenDetailsAuction).mockReturnValue({ status: TokenDetailsSourceState.Loading })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.pageQueryLoading).toBe(false))
  })

  it('preserves the existing redirect state when the canonical lookup fails', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockRejectedValue(new Error('canonical unavailable'))
    mocked(useTokenDetailsAuction).mockReturnValue({
      status: TokenDetailsSourceState.Error,
      error: new Error('auction unavailable'),
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => expect(result.current.state.pageQueryLoading).toBe(false))

    expect(result.current.state.currency).toBeUndefined()
  })

  it('returns native currency when tokenAddress is NATIVE_CHAIN_ID', () => {
    mocked(useParams).mockReturnValue({
      tokenAddress: NATIVE_CHAIN_ID,
      chainName: 'ethereum',
    })

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
})

describe('core new endpoint functionality', () => {
  beforeEach(() => {
    restMocks.querySalt += 1
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({ token: restMultichainToken })
    mocked(useParams).mockReturnValue({
      tokenAddress: normalizeTokenAddressForCache(USDC_MAINNET.address),
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

  it('derives the context from REST', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

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

  it('requests GetTokenMultiChain with the cache-normalized URL address (same key the shared hooks build)', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    expect(restMocks.getTokenMultiChainQueryFn).toHaveBeenCalled()
    const getTokenMultiChainCall = restMocks.getTokenMultiChainQueryFn.mock.calls[0]?.[0] as { queryKey: unknown[] }
    expect(getTokenMultiChainCall.queryKey).toContainEqual({
      identifier: {
        case: 'token',
        value: { chainId: UniverseChainId.Mainnet, address: USDC_MAINNET.address.toLowerCase() },
      },
    })
  })

  it('builds multiChainMap from the multichain addresses map', async () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multiChainMap).toEqual({
      [UniverseChainId.Mainnet]: { address: USDC_MAINNET.address, balance: undefined },
      [UniverseChainId.Base]: { address: USDC_BASE_ADDRESS, balance: undefined },
    })
  })

  it('matches portfolio balances to checksummed REST addresses despite lowercase balance ids', async () => {
    const mainnetBalance = { quantity: 100 }
    const baseBalance = { quantity: 25 }
    vi.mocked(usePortfolioBalances).mockReturnValue({
      // REST portfolio balances are keyed by lowercase currency ids; GetTokenMultiChain
      // addresses are checksummed — the map must still associate them.
      data: {
        [`${UniverseChainId.Mainnet}-${normalizeTokenAddressForCache(USDC_MAINNET.address)}`]: mainnetBalance,
        [`${UniverseChainId.Base}-${normalizeTokenAddressForCache(USDC_BASE_ADDRESS)}`]: baseBalance,
      },
      error: undefined,
    } as unknown as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multiChainMap).toEqual({
      [UniverseChainId.Mainnet]: { address: USDC_MAINNET.address, balance: mainnetBalance },
      [UniverseChainId.Base]: { address: USDC_BASE_ADDRESS, balance: baseBalance },
    })
  })

  // Polygon's canonical native address is the real 0x…1010 placeholder, not the zero address the
  // v2 backend serves for native deployments — the map must still recognize it as native and match
  // the wallet's balance (buildNativeCurrencyId), not treat it as a distinct zero-address token.
  it('matches a Polygon native deployment served as the zero address to the native balance', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({
      token: {
        ...restMultichainToken,
        ...multichainDeploymentFields({
          ...restMultichainAddresses,
          [String(UniverseChainId.Polygon)]: '0x0000000000000000000000000000000000000000',
        }),
      },
    })
    const polygonBalance = { quantity: 10 }
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: { [buildNativeCurrencyId(UniverseChainId.Polygon)]: polygonBalance },
      error: undefined,
    } as unknown as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multiChainMap[UniverseChainId.Polygon]).toEqual({
      address: undefined,
      balance: polygonBalance,
    })
  })

  // The backend serves tokens outside the multichain index as a single-entry response, so a
  // genuinely single-chain token resolves with one address rather than erroring.
  it('handles a single-chain multichainToken resolved by GetTokenMultiChain', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({
      token: {
        ...restMultichainToken,
        ...multichainDeploymentFields({ [String(UniverseChainId.Mainnet)]: USDC_MAINNET.address }),
      },
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.multichainToken).toMatchObject({
      addresses: { [String(UniverseChainId.Mainnet)]: USDC_MAINNET.address },
    })
    expect(result.current.state.multiChainMap).toEqual({
      [UniverseChainId.Mainnet]: { address: USDC_MAINNET.address, balance: undefined },
    })
  })

  // A native deployment's address is falsy but present (isNativeCurrencyAddress treats empty as
  // native) — distinct from the chain being absent from the map, which must return undefined.
  it('derives a defined token for a native deployment with a falsy address entry', async () => {
    mocked(useParams).mockReturnValue({
      tokenAddress: NATIVE_CHAIN_ID,
      chainName: 'ethereum',
    })
    restMocks.getTokenMultiChainQueryFn.mockReset().mockResolvedValue({
      token: { ...restMultichainToken, ...multichainDeploymentFields({ [String(UniverseChainId.Mainnet)]: '' }) },
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.multichainTokenLoaded).toBe(true)
    })

    expect(result.current.state.token).toBeDefined()
    expect(result.current.state.token?.address).toBe('')
  })

  // keepPreviousData can serve a stale, chain-mismatched token with isLoading: false — pageQueryLoading
  // must stay true through that window instead of settling into a false redirect-eligible state.
  it('keeps pageQueryLoading true while navigating to a token whose chain is absent from the stale placeholder data', async () => {
    const { result, rerender } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.ArbitrumOne)
    mocked(useParams).mockReturnValue({
      tokenAddress: '0x0000000000000000000000000000000000000abc',
      chainName: 'arbitrum',
    })
    // Leaves the new query key's fetch pending, so the observer keeps serving restMultichainToken
    // (no ArbitrumOne entry in its addresses) as placeholder data for the new key.
    restMocks.getTokenMultiChainQueryFn.mockReturnValue(new Promise(() => {}))

    rerender()

    expect(result.current.state.pageQueryLoading).toBe(true)
    expect(result.current.state.chainDataLoading).toBe(true)

    mocked(useChainIdFromUrlParam).mockReturnValue(UniverseChainId.Mainnet)
  })

  it('keeps the page loading when an auction resolves before a same-chain token navigation', async () => {
    const { result, rerender } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.currency).toBeDefined()
    })

    mocked(useParams).mockReturnValue({
      tokenAddress: '0x0000000000000000000000000000000000000abc',
      chainName: 'ethereum',
    })
    restMocks.getTokenMultiChainQueryFn.mockReturnValue(new Promise(() => {}))
    mocked(useTokenDetailsAuction).mockReturnValue({
      status: TokenDetailsSourceState.Found,
      auction: { address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>,
      auctions: [{ address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>],
    })

    rerender()

    expect(result.current.state.currency?.wrapped.address).toBe(USDC_MAINNET.address)
    expect(result.current.state.pageQueryLoading).toBe(true)
  })

  it('stays pending (no redirect-eligible state) while GetTokenMultiChain is loading', () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockReturnValue(new Promise(() => {}))

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.pageQueryLoading).toBe(true)
    expect(result.current.state.chainDataLoading).toBe(true)
    expect(result.current.state.multichainTokenLoaded).toBe(false)
  })

  it('redirects after GetTokenMultiChain fails even when an auction resolves', async () => {
    restMocks.getTokenMultiChainQueryFn.mockReset().mockRejectedValue(new Error('permission_denied'))
    mocked(useTokenDetailsAuction).mockReturnValue({
      status: TokenDetailsSourceState.Found,
      auction: { address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>,
      auctions: [{ address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>],
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.pageQueryLoading).toBe(false)
    })

    expect(result.current.state.currency).toBeUndefined()
  })

  it('keeps the page redirect-eligible when GetTokenMultiChain returns NotFound and an auction resolves', async () => {
    restMocks.getTokenMultiChainQueryFn
      .mockReset()
      .mockRejectedValue(new ConnectError('Token not found', Code.NotFound))
    mocked(useTokenDetailsAuction).mockReturnValue({
      status: TokenDetailsSourceState.Found,
      auction: { address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>,
      auctions: [{ address: '0x1111111111111111111111111111111111111111' } as PlainMessage<Auction>],
    })

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    await waitFor(() => {
      expect(result.current.state.pageQueryLoading).toBe(false)
    })

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.auctionSource.status).toBe(TokenDetailsSourceState.Found)
  })
})
