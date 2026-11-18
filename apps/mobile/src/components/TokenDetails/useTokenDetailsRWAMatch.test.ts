import { renderHook } from '@testing-library/react-native'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import {
  useIsTokenDetailsRWAMatchLoading,
  useTokenDetailsRWAMatch,
} from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'

vi.mock('uniswap/src/features/rwa/useRwaTokenGroup', () => ({
  useRwaTokenGroup: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories', () => ({
  useTokenCategories: vi.fn(),
}))

vi.mock('src/components/TokenDetails/TokenDetailsContext', () => ({
  useTokenDetailsContext: vi.fn(),
}))

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'
const SIBLING_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'

const mockUseTokenDetailsContext = useTokenDetailsContext as MockedFunction<typeof useTokenDetailsContext>
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
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: false })
    mockUseTokenCategories.mockReturnValue({ categories: [STOCKS_CATEGORY], isLoading: false })
  })

  it('resolves the match from the token group by the page token', () => {
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
  })

  it('returns undefined when the token has no group', () => {
    const { result } = renderHook(() => useTokenDetailsRWAMatch())

    expect(result.current).toBeUndefined()
  })

  it('skips the group lookup for a token in no grouped category', () => {
    mockUseTokenCategories.mockReturnValue({ categories: [], isLoading: false })

    renderHook(() => useTokenDetailsRWAMatch())

    expect(mockUseRwaTokenGroup).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('reports loading while the group lookup is unresolved', () => {
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: true })

    expect(renderHook(() => useIsTokenDetailsRWAMatchLoading()).result.current).toBe(true)
  })
})
