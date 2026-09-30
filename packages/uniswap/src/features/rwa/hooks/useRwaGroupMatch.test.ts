import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useRwaGroupMatch } from 'uniswap/src/features/rwa/hooks/useRwaGroupMatch'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/rwa/useRwaTokenGroup', () => ({
  useRwaTokenGroup: vi.fn(),
}))

const mockUseRwaTokenGroup = vi.mocked(useRwaTokenGroup)

const STOCKS = tokenCategory({ id: 'stocks', name: 'Stocks', grouped: true })
const COMMODITIES = tokenCategory({ id: 'commodities', name: 'Commodities', grouped: false })
const SUBJECT = { chainId: UniverseChainId.Mainnet, address: '0x1111111111111111111111111111111111111111' }

const GROUP_TOKEN: RWAToken = {
  chainId: UniverseChainId.Mainnet,
  address: SUBJECT.address,
  issuer: 'ondo',
  name: 'Tesla (Ondo)',
  symbol: 'TSLAON',
  logoUrl: '',
}
const GROUP_MATCH: RWAMatch = {
  asset: { symbol: 'TSLA', name: 'Tesla', icon: '', tokens: [GROUP_TOKEN], category: RwaCategory.STOCKS },
  token: GROUP_TOKEN,
}

function renderGroupMatch(overrides: Partial<Parameters<typeof useRwaGroupMatch>[0]> = {}) {
  return renderHook(() =>
    useRwaGroupMatch({
      subject: SUBJECT,
      categories: [STOCKS],
      isCategoriesLoading: false,
      enabled: true,
      ...overrides,
    }),
  ).result.current
}

describe(useRwaGroupMatch, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: false })
  })

  it('looks up the group for a token in a grouped category and returns its match', () => {
    mockUseRwaTokenGroup.mockReturnValue({
      tokenGroup: { rwaMatch: GROUP_MATCH, otherIssuerTokens: [], marketDataByToken: new Map() },
      isLoading: false,
    })

    expect(renderGroupMatch()).toEqual({ rwaMatch: GROUP_MATCH, isLoading: false })
    expect(mockUseRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: true })
  })

  it('never looks up a group for a token outside every grouped category', () => {
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: true })

    expect(renderGroupMatch({ categories: [COMMODITIES] })).toEqual({ rwaMatch: undefined, isLoading: false })
    expect(mockUseRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: false })
  })

  it('disables the lookup and never reports loading when disabled', () => {
    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: true })

    expect(renderGroupMatch({ enabled: false, isCategoriesLoading: true })).toEqual({
      rwaMatch: undefined,
      isLoading: false,
    })
    expect(mockUseRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: false })
  })

  it('reports loading while the categories or the group are unresolved', () => {
    expect(renderGroupMatch({ categories: [], isCategoriesLoading: true }).isLoading).toBe(true)

    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: true })
    expect(renderGroupMatch().isLoading).toBe(true)

    mockUseRwaTokenGroup.mockReturnValue({ tokenGroup: undefined, isLoading: false })
    expect(renderGroupMatch().isLoading).toBe(false)
  })
})
