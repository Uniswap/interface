import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useIsTDPRWAMatchLoading, useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPTokenCategories', () => ({
  useTDPTokenCategories: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRwaTokenGroup', () => ({
  useRwaTokenGroup: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRWAMatch', () => ({
  useRWAMatch: vi.fn(),
}))

const STOCKS_CATEGORY = tokenCategory({ id: 'stocks', name: 'Stocks', grouped: true })
const SUBJECT = { chainId: UniverseChainId.Mainnet, address: USDC_MAINNET.address }

const GROUP_TOKEN: RWAToken = {
  chainId: UniverseChainId.Mainnet,
  address: USDC_MAINNET.address,
  issuer: 'ondo',
  name: 'Tesla (Ondo)',
  symbol: 'TSLAON',
  logoUrl: '',
}
const GROUP_MATCH: RWAMatch = {
  asset: { symbol: 'TSLA', name: 'Tesla', icon: '', tokens: [GROUP_TOKEN], category: RwaCategory.STOCKS },
  token: GROUP_TOKEN,
}
const WHITELIST_MATCH: RWAMatch = { ...GROUP_MATCH, token: { ...GROUP_TOKEN, issuer: 'xstocks' } }

describe(useTDPRWAMatch, () => {
  beforeEach(() => {
    const state = { currency: USDC_MAINNET, currencyChainId: UniverseChainId.Mainnet } as unknown as TDPState
    mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
      selector(state)) as typeof useTDPStore)
    mocked(useTDPTokenCategories).mockReturnValue({ categories: [STOCKS_CATEGORY], isLoading: false })
    mocked(useRwaTokenGroup).mockReturnValue({ tokenGroup: undefined, isLoading: false })
    mocked(useRWAMatch).mockReturnValue(WHITELIST_MATCH)
  })

  it('uses the v1 whitelist match when token categories are off', () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)

    const { result } = renderHook(() => useTDPRWAMatch())

    expect(result.current).toBe(WHITELIST_MATCH)
    expect(useRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: false })
  })

  describe('with token categories on', () => {
    beforeEach(() => {
      mocked(useIsTokenCategoriesEnabled).mockReturnValue(true)
    })

    it('resolves the match from the token group for a grouped-category token', () => {
      mocked(useRwaTokenGroup).mockReturnValue({
        tokenGroup: { rwaMatch: GROUP_MATCH, otherIssuerTokens: [], marketDataByToken: new Map() },
        isLoading: false,
      })

      const { result } = renderHook(() => useTDPRWAMatch())

      expect(result.current).toBe(GROUP_MATCH)
      expect(useRwaTokenGroup).toHaveBeenCalledWith({ subject: SUBJECT, enabled: true })
      expect(useRWAMatch).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('reports loading while the group lookup is unresolved', () => {
      mocked(useRwaTokenGroup).mockReturnValue({ tokenGroup: undefined, isLoading: true })

      expect(renderHook(() => useIsTDPRWAMatchLoading()).result.current).toBe(true)
    })
  })

  it('never reports loading when token categories are off', () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)
    mocked(useTDPTokenCategories).mockReturnValue({ categories: [], isLoading: true })

    expect(renderHook(() => useIsTDPRWAMatchLoading()).result.current).toBe(false)
  })
})
