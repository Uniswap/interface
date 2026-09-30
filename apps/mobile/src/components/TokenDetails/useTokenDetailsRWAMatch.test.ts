import { renderHook } from '@testing-library/react-native'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import {
  useIsTokenDetailsRWAMatchLoading,
  useTokenDetailsRWAMatch,
} from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'

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

vi.mock('@universe/gating', async () => {
  const actual = await vi.importActual<typeof import('@universe/gating')>('@universe/gating')
  return { ...actual, useIsTokenCategoriesEnabled: vi.fn() }
})

vi.mock('uniswap/src/features/rwa/useRwaTokenGroup', () => ({
  useRwaTokenGroup: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories', () => ({
  useTokenCategories: vi.fn(),
}))

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRWAWhitelist', () => ({
  useRWAWhitelist: vi.fn(),
}))

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const SIBLING_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'

const mockUseTokenDetailsContext = useTokenDetailsContext as MockedFunction<typeof useTokenDetailsContext>
const mockUseRWAWhitelist = useRWAWhitelist as MockedFunction<typeof useRWAWhitelist>
const mockUseIsTokenCategoriesEnabled = useIsTokenCategoriesEnabled as MockedFunction<
  typeof useIsTokenCategoriesEnabled
>
const mockUseRwaTokenGroup = useRwaTokenGroup as MockedFunction<typeof useRwaTokenGroup>
const mockUseTokenCategories = useTokenCategories as MockedFunction<typeof useTokenCategories>
const STOCKS_CATEGORY = tokenCategory({ id: 'stocks', name: 'Stocks', grouped: true })

const SIBLING_RWA_TOKEN = {
  chainId: UniverseChainId.Polygon,
  address: SIBLING_TOKEN_ADDRESS,
  issuer: 'issuer',
  name: 'RWA Asset',
  symbol: 'RWA',
  logoUrl: 'https://example.com/rwa.png',
}

const RWA_ASSET = {
  symbol: 'RWA',
  name: 'RWA Asset',
  icon: 'https://example.com/rwa.png',
  category: RwaCategory.STOCKS,
  tokens: [SIBLING_RWA_TOKEN],
}

describe(useTokenDetailsRWAMatch, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTokenDetailsContext.mockReturnValue({
      address: TOKEN_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, TOKEN_ADDRESS),
      multichainTokens: [
        { chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS },
        { chainId: UniverseChainId.Polygon, address: SIBLING_TOKEN_ADDRESS },
      ],
    } as ReturnType<typeof useTokenDetailsContext>)
    mockUseRWAWhitelist.mockReturnValue([RWA_ASSET])
    mockUseIsTokenCategoriesEnabled.mockReturnValue(false)
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: false })
    mockUseTokenCategories.mockReturnValue({ categories: [STOCKS_CATEGORY], isLoading: false })
  })

  it('matches a sibling deployment against the RWA whitelist', () => {
    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toEqual({ asset: RWA_ASSET, token: SIBLING_RWA_TOKEN })
  })

  it('matches the TDP token itself ahead of its sibling deployments', () => {
    const mainnetToken = { ...SIBLING_RWA_TOKEN, chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS }
    const mainnetAsset = { ...RWA_ASSET, tokens: [mainnetToken, SIBLING_RWA_TOKEN] }
    mockUseRWAWhitelist.mockReturnValue([mainnetAsset])

    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toEqual({ asset: mainnetAsset, token: mainnetToken })
  })

  it('returns undefined when no candidate matches the whitelist', () => {
    mockUseRWAWhitelist.mockReturnValue([])

    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toBeUndefined()
  })

  describe('with token categories on', () => {
    beforeEach(() => {
      mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    })

    it('resolves the match from the token group by the page token and skips the whitelist', () => {
      const groupToken = { ...SIBLING_RWA_TOKEN, chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS }
      const groupMatch = { asset: { ...RWA_ASSET, tokens: [groupToken] }, token: groupToken }
      mockUseRwaTokenGroup.mockReturnValue({
        tokenGroup: { rwaMatch: groupMatch, otherIssuerTokens: [], marketDataByToken: new Map() },
        isLoading: false,
      })

      const { result } = renderHook(() => useTokenDetailsRWAMatch())

      expect(result.current).toEqual(groupMatch)
      expect(mockUseRwaTokenGroup).toHaveBeenCalledWith({
        subject: { chainId: UniverseChainId.Mainnet, address: TOKEN_ADDRESS },
        enabled: true,
      })
      expect(mockUseRWAWhitelist).toHaveBeenCalledWith({ enabled: false })
    })

    it('returns undefined for an ungrouped token even when the whitelist would match', () => {
      const { result } = renderHook(() => useTokenDetailsRWAMatch())

      expect(result.current).toBeUndefined()
    })

    it('reports loading while the group lookup is unresolved', () => {
      mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: true })

      expect(renderHook(() => useIsTokenDetailsRWAMatchLoading()).result.current).toBe(true)
    })
  })

  it('never reports loading when token categories are off', () => {
    mockUseTokenCategories.mockReturnValue({ categories: [], isLoading: true })

    expect(renderHook(() => useIsTokenDetailsRWAMatchLoading()).result.current).toBe(false)
  })
})
