import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TdpChainSelectionType } from 'uniswap/src/utils/linking'
import { useNavigateToTokenDetails } from '~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails'
import { renderHook } from '~/test-utils/render'

const navigateMock = vi.fn()

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigateMock,
}))

const BASE_TOKEN = {
  chainId: UniverseChainId.Base,
  address: '0x4200000000000000000000000000000000000006',
  isNative: false,
} as const

describe('useNavigateToTokenDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to a path-only URL for the token own chain when no selection is passed', () => {
    const { result } = renderHook(() => useNavigateToTokenDetails())
    result.current(BASE_TOKEN)
    expect(navigateMock).toHaveBeenCalledWith(`/explore/tokens/base/${BASE_TOKEN.address}`)
  })

  it('navigates to the aggregate multichain URL for a multichain selection', () => {
    const { result } = renderHook(() => useNavigateToTokenDetails())
    result.current(BASE_TOKEN, { type: TdpChainSelectionType.Multichain })
    expect(navigateMock).toHaveBeenCalledWith(`/explore/tokens/base/${BASE_TOKEN.address}?chain=multichain`)
  })

  it('navigates with a network query when the selected chain differs from the token chain', () => {
    const { result } = renderHook(() => useNavigateToTokenDetails())
    result.current(BASE_TOKEN, { type: TdpChainSelectionType.Chain, chainId: UniverseChainId.Mainnet })
    expect(navigateMock).toHaveBeenCalledWith(`/explore/tokens/base/${BASE_TOKEN.address}?chain=ethereum`)
  })

  it('navigates to a path-only URL when the selected chain matches the token chain', () => {
    const { result } = renderHook(() => useNavigateToTokenDetails())
    result.current(BASE_TOKEN, { type: TdpChainSelectionType.Chain, chainId: UniverseChainId.Base })
    expect(navigateMock).toHaveBeenCalledWith(`/explore/tokens/base/${BASE_TOKEN.address}`)
  })
})
