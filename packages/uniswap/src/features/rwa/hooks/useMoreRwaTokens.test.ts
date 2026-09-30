import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useMoreRwaTokens } from 'uniswap/src/features/rwa/hooks/useMoreRwaTokens'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { rwaTokenMarketDataKey, useRWAIssuerMarketData } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockUseIsTokenCategoriesEnabled: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
}))

vi.mock('uniswap/src/features/rwa/useRwaTokenGroup', () => ({
  useRwaTokenGroup: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRWAIssuerMarketData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/rwa/useRWAIssuerMarketData')>()),
  useRWAIssuerMarketData: vi.fn(),
}))

const mockUseRwaTokenGroup = vi.mocked(useRwaTokenGroup)
const mockUseRWAIssuerMarketData = vi.mocked(useRWAIssuerMarketData)

function makeToken(overrides: Partial<RWAToken>): RWAToken {
  return {
    chainId: UniverseChainId.Mainnet,
    address: '0x0000000000000000000000000000000000000001',
    issuer: 'ondo',
    name: 'Tesla (Ondo)',
    symbol: 'TSLAON',
    logoUrl: '',
    ...overrides,
  }
}

const SUBJECT_TOKEN = makeToken({})
const XSTOCKS_TOKEN = makeToken({ address: '0x0000000000000000000000000000000000000002', issuer: 'xstocks' })
const OTHER_ONDO_TOKEN = makeToken({ address: '0x0000000000000000000000000000000000000003', issuer: 'ondo' })

const RWA_MATCH: RWAMatch = {
  asset: {
    symbol: 'TSLA',
    name: 'Tesla',
    icon: '',
    tokens: [SUBJECT_TOKEN, XSTOCKS_TOKEN, OTHER_ONDO_TOKEN],
    category: RwaCategory.STOCKS,
  },
  token: SUBJECT_TOKEN,
}
const SUBJECT = { chainId: SUBJECT_TOKEN.chainId, address: SUBJECT_TOKEN.address }
const GROUP_MARKET_DATA = { priceUsd: 327.24, marketCapUsd: 13_400_000, volume24hUsd: 2_900_000 }

describe(useMoreRwaTokens, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: false })
    mockUseRWAIssuerMarketData.mockReturnValue(() => ({ priceUsd: 1 }))
  })

  it('serves siblings and card stats from the token group when token categories are on', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    mockUseRwaTokenGroup.mockReturnValue({
      tokenGroup: {
        rwaMatch: RWA_MATCH,
        otherIssuerTokens: [XSTOCKS_TOKEN, OTHER_ONDO_TOKEN],
        marketDataByToken: new Map([[rwaTokenMarketDataKey(XSTOCKS_TOKEN), GROUP_MARKET_DATA]]),
      },
      isLoading: false,
    })

    const { result } = renderHook(() => useMoreRwaTokens({ rwaMatch: RWA_MATCH, subject: SUBJECT }))

    expect(mockUseRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: true })
    expect(result.current.otherIssuerTokens).toEqual([XSTOCKS_TOKEN, OTHER_ONDO_TOKEN])
    expect(result.current.getMarketData(XSTOCKS_TOKEN)).toEqual(GROUP_MARKET_DATA)
    expect(result.current.getMarketData(OTHER_ONDO_TOKEN)).toEqual({})
    // The GraphQL market-data query is left with nothing to fetch.
    expect(mockUseRWAIssuerMarketData).toHaveBeenCalledWith([])
  })

  it('falls back to the whitelist siblings and GraphQL stats when token categories are off', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useMoreRwaTokens({ rwaMatch: RWA_MATCH, subject: SUBJECT }))

    expect(mockUseRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: false })
    // v1 semantics: siblings are the other issuers, so a same-issuer token is dropped.
    expect(result.current.otherIssuerTokens).toEqual([XSTOCKS_TOKEN])
    expect(mockUseRWAIssuerMarketData).toHaveBeenCalledWith([XSTOCKS_TOKEN])
    expect(result.current.getMarketData(XSTOCKS_TOKEN)).toEqual({ priceUsd: 1 })
  })

  it('returns no siblings without a match', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)

    const { result } = renderHook(() => useMoreRwaTokens({ rwaMatch: undefined, subject: SUBJECT }))

    expect(result.current.otherIssuerTokens).toEqual([])
  })
})
