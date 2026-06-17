import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { RWACandidate } from 'uniswap/src/features/rwa/rwaMatch'
import { usePreferProjectMarketData } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/features/rwa/useRWAMatch', () => ({
  useRWAMatch: vi.fn(() => undefined),
}))

const mockUseFeatureFlag = vi.mocked(useFeatureFlag)
const mockUseRWAMatch = vi.mocked(useRWAMatch)

const candidates: RWACandidate[] = [{ chainId: 1, address: '0xabc' }]

describe(usePreferProjectMarketData, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseRWAMatch.mockReturnValue(undefined)
  })

  it('keeps project market data off when the flag is off', () => {
    const { result } = renderHook(() => usePreferProjectMarketData(candidates))

    expect(mockUseRWAMatch).toHaveBeenCalledWith({ candidates, enabled: false })
    expect(result.current).toBe(false)
  })

  it('keeps project market data off when the token is not an RWA match', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.RWACoinGeckoData)

    const { result } = renderHook(() => usePreferProjectMarketData(candidates))

    expect(mockUseRWAMatch).toHaveBeenCalledWith({ candidates, enabled: true })
    expect(result.current).toBe(false)
  })

  it('prefers project market data when the flag is on and the token is an RWA match', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.RWACoinGeckoData)
    mockUseRWAMatch.mockReturnValue({} as never)

    const { result } = renderHook(() => usePreferProjectMarketData(candidates))

    expect(result.current).toBe(true)
  })
})
