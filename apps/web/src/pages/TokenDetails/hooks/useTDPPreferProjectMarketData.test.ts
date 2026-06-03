import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTDPPreferProjectMarketData } from '~/pages/TokenDetails/hooks/useTDPPreferProjectMarketData'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPRWAMatch', () => ({
  useTDPRWAMatch: vi.fn(() => undefined),
}))

const mockUseFeatureFlag = vi.mocked(useFeatureFlag)
const mockUseTDPRWAMatch = vi.mocked(useTDPRWAMatch)

describe(useTDPPreferProjectMarketData, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseTDPRWAMatch.mockReturnValue(undefined)
  })

  it('keeps project market data off when the flag is off', () => {
    const { result } = renderHook(() => useTDPPreferProjectMarketData())

    expect(mockUseTDPRWAMatch).toHaveBeenCalledWith({ enabled: false })
    expect(result.current).toBe(false)
  })

  it('keeps project market data off when the token is not an RWA match', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.RWACoinGeckoData)

    const { result } = renderHook(() => useTDPPreferProjectMarketData())

    expect(mockUseTDPRWAMatch).toHaveBeenCalledWith({ enabled: true })
    expect(result.current).toBe(false)
  })

  it('prefers project market data when the flag is on and the token is an RWA match', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.RWACoinGeckoData)
    mockUseTDPRWAMatch.mockReturnValue({} as never)

    const { result } = renderHook(() => useTDPPreferProjectMarketData())

    expect(result.current).toBe(true)
  })
})
