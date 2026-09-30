import { waitFor } from '@testing-library/react-native'
import { UniverseChainId } from '@universe/chains'
import { useTokenMetadata, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const { mockGetGetTokenQueryOptions, mockGetGetTokenMultiChainQueryOptions } = vi.hoisted(() => ({
  mockGetGetTokenQueryOptions: vi.fn(),
  mockGetGetTokenMultiChainQueryOptions: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokenQueryOptions: mockGetGetTokenQueryOptions,
  getGetTokenMultiChainQueryOptions: mockGetGetTokenMultiChainQueryOptions,
}))

const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

const GET_TOKEN_RAW_RESPONSE = { token: { price: { spotUsd: 1.23, percentChange1d: 0.5 } } }
const GET_TOKEN_MULTICHAIN_RAW_RESPONSE = { token: { price: { spotUsd: 4.56 } } }

describe(useTokenSpotPrice, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mirrors the real query-options builders' contract: queryFn returns raw data, `select`
    // (the actual selectSpotUsd/selectMultichainSpotUsd from the source file) is left for
    // react-query to apply, so those selectors get exercised for real by this test.
    mockGetGetTokenQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getToken'],
      queryFn: () => Promise.resolve(GET_TOKEN_RAW_RESPONSE),
      enabled,
      select,
    }))
    mockGetGetTokenMultiChainQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokenMultiChain'],
      queryFn: () => Promise.resolve(GET_TOKEN_MULTICHAIN_RAW_RESPONSE),
      enabled,
      select,
    }))
  })

  describe('single chain', () => {
    it('returns the REST spot price from GetToken', async () => {
      const { result } = renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID))

      await waitFor(() => expect(result.current).toBe(1.23))
    })

    it('does not query GetTokenMultiChain when isMultichainAggregateView is not set', () => {
      renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
      expect(mockGetGetTokenMultiChainQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('disables both REST queries when skip is set', () => {
      renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID, { skip: true }))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockGetGetTokenMultiChainQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })
  })

  describe('multichain aggregate view', () => {
    it('fetches via GetTokenMultiChain using the token identifier, resolved from the known chainId+address', () => {
      renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID, { isMultichainAggregateView: true }))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockGetGetTokenMultiChainQueryOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          params: {
            identifier: { case: 'token', value: currencyIdToRestContractInput(CURRENCY_ID) },
          },
        }),
      )
    })

    it('returns the canonical-chain price from GetTokenMultiChain', async () => {
      const { result } = renderHookWithProviders(() =>
        useTokenSpotPrice(CURRENCY_ID, { isMultichainAggregateView: true }),
      )

      await waitFor(() => expect(result.current).toBe(4.56))
    })
  })
})

describe(useTokenMetadata, () => {
  // Salted per test so the module-level test QueryClient can't serve one test's GetToken cache to the next.
  let querySalt = 0

  function mockGetTokenResponse(response: unknown): void {
    querySalt += 1
    const salt = querySalt
    mockGetGetTokenQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getToken', 'metadata', salt],
      queryFn: () => Promise.resolve(response),
      enabled,
      select,
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves every metadata field from GetToken', async () => {
    mockGetTokenResponse({
      token: {
        name: 'Token Name',
        symbol: 'TKN',
        project: {
          logoUrl: 'https://example.com/logo.png',
          description: 'A description.',
          descriptionTranslations: { 'es-ES': 'Una descripción.' },
          homepageUrl: 'https://example.com',
          twitterName: 'handle',
        },
        safety: { isSpam: false },
      },
    })

    const { result } = renderHookWithProviders(() => useTokenMetadata(CURRENCY_ID))

    await waitFor(() => expect(result.current.name).toBe('Token Name'))

    expect(result.current.symbol).toBe('TKN')
    expect(result.current.logoUrl).toBe('https://example.com/logo.png')
    expect(result.current.description).toBe('A description.')
    expect(result.current.descriptionTranslations).toEqual({ 'es-ES': 'Una descripción.' })
    expect(result.current.homepageUrl).toBe('https://example.com')
    expect(result.current.twitterName).toBe('handle')
    expect(result.current.isSpam).toBe(false)
  })

  it('normalizes a full profile URL from GetToken (Solana metadata) to a bare handle', async () => {
    mockGetTokenResponse({
      token: {
        name: 'Token Name',
        symbol: 'TKN',
        project: { twitterName: 'https://x.com/bonk_inu' },
      },
    })

    const { result } = renderHookWithProviders(() => useTokenMetadata(CURRENCY_ID))

    await waitFor(() => expect(result.current.twitterName).toBe('bonk_inu'))
  })

  it('leaves fields undefined when GetToken omits them', async () => {
    mockGetTokenResponse({
      token: { name: 'Token Name', symbol: 'TKN', project: { logoUrl: 'https://example.com/logo.png' } },
    })

    const { result } = renderHookWithProviders(() => useTokenMetadata(CURRENCY_ID))

    await waitFor(() => expect(result.current.name).toBe('Token Name'))

    expect(result.current.description).toBeUndefined()
    expect(result.current.homepageUrl).toBeUndefined()
    expect(result.current.twitterName).toBeUndefined()
  })

  it('skips the query and reports not-loading when currencyId is undefined', () => {
    mockGetTokenResponse({ token: { name: 'Token Name', symbol: 'TKN' } })

    const { result } = renderHookWithProviders(() => useTokenMetadata(undefined))

    expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, params: undefined }),
    )
    expect(result.current.name).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })
})
