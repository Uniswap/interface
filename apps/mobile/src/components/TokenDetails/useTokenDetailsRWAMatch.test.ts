import { renderHook } from '@testing-library/react-native'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenDetailsPreferProjectMarketData } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: vi.fn(),
}))

vi.mock('@universe/api', async () => {
  const actual = await vi.importActual<typeof import('@universe/api')>('@universe/api')
  return {
    ...actual,
    GraphQLApi: {
      ...actual.GraphQLApi,
      useTokenDetailsScreenQuery: vi.fn(),
    },
  }
})

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRWAWhitelist', () => ({
  useRWAWhitelist: vi.fn(),
}))

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const SIBLING_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'

const mockUseFeatureFlag = useFeatureFlag as MockedFunction<typeof useFeatureFlag>
const mockUseTokenDetailsContext = useTokenDetailsContext as MockedFunction<typeof useTokenDetailsContext>
const mockUseRWAWhitelist = useRWAWhitelist as MockedFunction<typeof useRWAWhitelist>
const mockUseTokenDetailsScreenQuery = GraphQLApi.useTokenDetailsScreenQuery as MockedFunction<
  typeof GraphQLApi.useTokenDetailsScreenQuery
>

describe(useTokenDetailsPreferProjectMarketData, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.RWACoinGeckoData)
    mockUseTokenDetailsContext.mockReturnValue({
      address: TOKEN_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, TOKEN_ADDRESS),
    } as ReturnType<typeof useTokenDetailsContext>)
    mockUseTokenDetailsScreenQuery.mockReturnValue({
      data: {
        token: {
          project: {
            tokens: [
              { chain: GraphQLApi.Chain.Ethereum, address: TOKEN_ADDRESS },
              { chain: GraphQLApi.Chain.Polygon, address: SIBLING_TOKEN_ADDRESS },
            ],
          },
        },
      },
    } as ReturnType<typeof GraphQLApi.useTokenDetailsScreenQuery>)
    mockUseRWAWhitelist.mockReturnValue([
      {
        symbol: 'RWA',
        name: 'RWA Asset',
        icon: 'https://example.com/rwa.png',
        category: RwaCategory.STOCKS,
        tokens: [
          {
            chainId: UniverseChainId.Polygon,
            address: SIBLING_TOKEN_ADDRESS,
            issuer: 'issuer',
            name: 'RWA Asset',
            symbol: 'RWA',
            logoUrl: 'https://example.com/rwa.png',
          },
        ],
      },
    ])
  })

  it('keeps project market data off when the RWA CoinGecko flag is off', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    const { result } = renderHook(() => useTokenDetailsPreferProjectMarketData())

    expect(mockUseRWAWhitelist).toHaveBeenCalledWith(false)
    expect(result.current).toBe(false)
  })

  it('prefers project market data when a project sibling matches the RWA whitelist', () => {
    const { result } = renderHook(() => useTokenDetailsPreferProjectMarketData())

    expect(mockUseRWAWhitelist).toHaveBeenCalledWith(true)
    expect(result.current).toBe(true)
  })

  it('keeps project market data off when no RWA candidate matches', () => {
    mockUseRWAWhitelist.mockReturnValue([])

    const { result } = renderHook(() => useTokenDetailsPreferProjectMarketData())

    expect(result.current).toBe(false)
  })
})
