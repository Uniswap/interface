import { waitFor } from '@testing-library/react-native'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo, useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const {
  mockUseFeatureFlag,
  mockUseTokenQuery,
  mockUseTokensQuery,
  mockGetGetTokenQueryOptions,
  mockGetGetTokensQueryOptions,
} = vi.hoisted(() => ({
  mockUseFeatureFlag: vi.fn(),
  mockUseTokenQuery: vi.fn(),
  mockUseTokensQuery: vi.fn(),
  mockGetGetTokenQueryOptions: vi.fn(),
  mockGetGetTokensQueryOptions: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

vi.mock('@universe/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/api')>()
  return {
    ...actual,
    GraphQLApi: {
      ...actual.GraphQLApi,
      useTokenQuery: mockUseTokenQuery,
      useTokensQuery: mockUseTokensQuery,
    },
  }
})

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokenQueryOptions: mockGetGetTokenQueryOptions,
  getGetTokensQueryOptions: mockGetGetTokensQueryOptions,
}))

// Deliberately not a well-known COMMON_BASES address (e.g. USDC/DAI) — those short-circuit
// through getCommonBase and would mask the GraphQL/REST branch this test exercises.
const ADDRESS = '0x1234567890123456789012345678901234567890'
const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, ADDRESS)

const GQL_TOKEN = {
  chain: 'ETHEREUM',
  address: ADDRESS,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin (GraphQL)',
  project: { logoUrl: 'https://example.com/gql.png', isSpam: false, id: 'gql-project-id' },
}

const REST_TOKEN = {
  chainId: UniverseChainId.Mainnet,
  address: ADDRESS,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin (REST)',
  project: { logoUrl: 'https://example.com/rest.png' },
  safety: { isSpam: false, isVerified: true, isBlocked: false },
  multichain: { id: 'usdc-multichain-id', addresses: { '1': ADDRESS } },
}

describe(useCurrencyInfo, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTokenQuery.mockReturnValue({ data: { token: GQL_TOKEN }, loading: false })
    mockUseTokensQuery.mockReturnValue({ data: { tokens: [GQL_TOKEN] }, loading: false })

    mockGetGetTokenQueryOptions.mockImplementation(({ enabled }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getToken'],
      queryFn: () => Promise.resolve({ token: REST_TOKEN }),
      enabled,
    }))
    mockGetGetTokensQueryOptions.mockImplementation(({ enabled }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokens'],
      queryFn: () => Promise.resolve({ tokens: [REST_TOKEN] }),
      enabled,
    }))
  })

  describe('V2 off (legacy GraphQL)', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it('returns a CurrencyInfo built from the GraphQL token', () => {
      const { result } = renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

      expect(result.current?.currency.name).toBe('USD Coin (GraphQL)')
      expect(result.current?.logoUrl).toBe('https://example.com/gql.png')
      expect(result.current?.projectId).toBe('gql-project-id')
    })

    it('does not fetch REST', () => {
      renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

      expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })
  })

  describe('V2 on (REST)', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('returns a CurrencyInfo built from the REST token', async () => {
      const { result } = renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

      await waitFor(() => expect(result.current?.currency.name).toBe('USD Coin (REST)'))
      expect(result.current?.logoUrl).toBe('https://example.com/rest.png')
      expect(result.current?.isBridged).toBe(false)
      expect(result.current?.bridgedWithdrawalInfo).toBeUndefined()
    })

    // Regression: projectId drives cross-chain "same asset" matching downstream (e.g.
    // sameAssetBridgeDetected in swap, multichain grouping in search history) — it must not
    // silently go undefined under the V2 REST path.
    it('populates projectId from the REST token multichain id', async () => {
      const { result } = renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

      await waitFor(() => expect(result.current?.projectId).toBe('usdc-multichain-id'))
    })

    it('skips the GraphQL query', () => {
      renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

      expect(mockUseTokenQuery).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
    })
  })
})

describe(useCurrencyInfos, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTokensQuery.mockReturnValue({ data: { tokens: [GQL_TOKEN] }, loading: false })
    mockGetGetTokensQueryOptions.mockImplementation(({ enabled }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokens'],
      queryFn: () => Promise.resolve({ tokens: [REST_TOKEN] }),
      enabled,
    }))
  })

  it('matches REST batch results back to the requested currencyIds by chainId+address', async () => {
    mockUseFeatureFlag.mockReturnValue(true)

    const { result } = renderHookWithProviders(() => useCurrencyInfos([CURRENCY_ID]))

    await waitFor(() => expect(result.current[0]?.currency.name).toBe('USD Coin (REST)'))
  })

  it('falls back to GraphQL when the flag is off', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    const { result } = renderHookWithProviders(() => useCurrencyInfos([CURRENCY_ID]))

    expect(result.current[0]?.currency.name).toBe('USD Coin (GraphQL)')
  })
})
