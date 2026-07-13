import { usePreferProjectMarketData } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { useTDPPreferProjectMarketData } from '~/pages/TokenDetails/hooks/useTDPPreferProjectMarketData'
import { useTDPRWACandidates } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'
import { renderHook } from '~/test-utils/render'

vi.mock('uniswap/src/features/rwa/usePreferProjectMarketData', () => ({
  usePreferProjectMarketData: vi.fn(() => false),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPRWAMatch', () => ({
  useTDPRWACandidates: vi.fn(() => []),
}))

const mockUsePreferProjectMarketData = vi.mocked(usePreferProjectMarketData)
const mockUseTDPRWACandidates = vi.mocked(useTDPRWACandidates)

describe(useTDPPreferProjectMarketData, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTDPRWACandidates.mockReturnValue([])
    mockUsePreferProjectMarketData.mockReturnValue(false)
  })

  it('delegates to usePreferProjectMarketData with TDP candidates', () => {
    const candidates = [{ chainId: 1, address: '0xabc' }]
    mockUseTDPRWACandidates.mockReturnValue(candidates)
    mockUsePreferProjectMarketData.mockReturnValue(true)

    const { result } = renderHook(() => useTDPPreferProjectMarketData())

    expect(mockUseTDPRWACandidates).toHaveBeenCalled()
    expect(mockUsePreferProjectMarketData).toHaveBeenCalledWith(candidates)
    expect(result.current).toBe(true)
  })
})
