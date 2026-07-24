import { waitFor } from '@testing-library/react-native'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  resolveSpotPriceOverride,
  useTokenSpotPrice,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const {
  mockUseFeatureFlag,
  mockUseTokenMarketPartsFragment,
  mockUseTokenProjectMarketsPartsFragment,
  mockGetGetTokenQueryOptions,
  mockGetGetTokensMultiChainQueryOptions,
} = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseTokenMarketPartsFragment: vi.fn(),
  mockUseTokenProjectMarketsPartsFragment: vi.fn(),
  mockGetGetTokenQueryOptions: vi.fn(),
  mockGetGetTokensMultiChainQueryOptions: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

vi.mock('uniswap/src/data/graphql/uniswap-data-api/fragments', () => ({
  useTokenMarketPartsFragment: mockUseTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment: mockUseTokenProjectMarketsPartsFragment,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokenQueryOptions: mockGetGetTokenQueryOptions,
  getGetTokensMultiChainQueryOptions: mockGetGetTokensMultiChainQueryOptions,
}))

const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

const GET_TOKEN_RAW_RESPONSE = { token: { price: { spotUsd: 1.23, percentChange1d: 0.5 } } }
const GET_TOKENS_MULTICHAIN_RAW_RESPONSE = { tokens: [{ price: { spotUsd: 4.56 } }] }

describe(useTokenSpotPrice, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTokenMarketPartsFragment.mockReturnValue({ data: { market: { price: { value: 10 } } } })
    mockUseTokenProjectMarketsPartsFragment.mockReturnValue({
      data: { project: { markets: [{ price: { value: 20 } }] } },
    })

    // Mirrors the real query-options builders' contract: queryFn returns raw data, `select`
    // (the actual selectSpotUsd/selectMultichainSpotUsd from the source file) is left for
    // react-query to apply, so those selectors get exercised for real by this test.
    mockGetGetTokenQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getToken'],
      queryFn: () => Promise.resolve(GET_TOKEN_RAW_RESPONSE),
      enabled,
      select,
    }))
    mockGetGetTokensMultiChainQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokensMultiChain'],
      queryFn: () => Promise.resolve(GET_TOKENS_MULTICHAIN_RAW_RESPONSE),
      enabled,
      select,
    }))
  })

  describe('V2 off (legacy GraphQL)', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it('prefers the per-chain subgraph price by default', () => {
      const { result } = renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID))

      expect(result.current).toBe(10)
    })

    it('prefers the project market price when preferProjectMarketData is true', () => {
      const { result } = renderHookWithProviders(() =>
        useTokenSpotPrice(CURRENCY_ID, { preferProjectMarketData: true }),
      )

      expect(result.current).toBe(20)
    })

    it('does not fetch REST at all', () => {
      renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockGetGetTokensMultiChainQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })
  })

  describe('V2 on, single chain', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('returns the REST spot price from GetToken', async () => {
      const { result } = renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID))

      await waitFor(() => expect(result.current).toBe(1.23))
    })

    it('does not query GetTokensMultiChain when isMultichainAggregateView is not set', () => {
      renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
      expect(mockGetGetTokensMultiChainQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })
  })

  describe('V2 on, multichain aggregate view', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('fetches via GetTokensMultiChain using the tokens identifier, resolved from the known chainId+address', () => {
      renderHookWithProviders(() => useTokenSpotPrice(CURRENCY_ID, { isMultichainAggregateView: true }))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
      expect(mockGetGetTokensMultiChainQueryOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          params: {
            identifier: { case: 'tokens', value: { tokens: [currencyIdToRestContractInput(CURRENCY_ID)] } },
          },
        }),
      )
    })

    it('returns the canonical-chain price from GetTokensMultiChain', async () => {
      const { result } = renderHookWithProviders(() =>
        useTokenSpotPrice(CURRENCY_ID, { isMultichainAggregateView: true }),
      )

      await waitFor(() => expect(result.current).toBe(4.56))
    })
  })
})

describe(resolveSpotPriceOverride, () => {
  it('uses the spot price when V2 is enabled, even on the all-networks aggregate view', () => {
    expect(
      resolveSpotPriceOverride({
        isV2TokensEnabled: true,
        isMultichainAggregateView: true,
        preferProjectMarketData: false,
        spotPrice: 42,
      }),
    ).toBe(42)
  })

  it('discards the spot price on the aggregate view when V2 is disabled and not RWA', () => {
    expect(
      resolveSpotPriceOverride({
        isV2TokensEnabled: false,
        isMultichainAggregateView: true,
        preferProjectMarketData: false,
        spotPrice: 42,
      }),
    ).toBeUndefined()
  })

  it('keeps the spot price on the aggregate view when V2 is disabled but RWA/project-market-preferred', () => {
    expect(
      resolveSpotPriceOverride({
        isV2TokensEnabled: false,
        isMultichainAggregateView: true,
        preferProjectMarketData: true,
        spotPrice: 42,
      }),
    ).toBe(42)
  })

  it('keeps the spot price outside the aggregate view regardless of the flag', () => {
    expect(
      resolveSpotPriceOverride({
        isV2TokensEnabled: false,
        isMultichainAggregateView: false,
        preferProjectMarketData: false,
        spotPrice: 42,
      }),
    ).toBe(42)
  })
})
