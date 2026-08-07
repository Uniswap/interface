import { act, renderHook } from '@testing-library/react'
import { useChartScrub } from 'src/screens/PortfolioChartDetailsScreen/useChartScrub'

const { mockLightHaptic } = vi.hoisted(() => ({
  mockLightHaptic: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('uniswap/src/features/settings/useHapticFeedback/useHapticFeedback', () => ({
  useHapticFeedback: () => ({ hapticFeedback: { light: mockLightHaptic } }),
}))

describe('useChartScrub', () => {
  let pendingAnimationFrame: FrameRequestCallback | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    pendingAnimationFrame = undefined
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pendingAnimationFrame = callback
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads every category at the scrubbed total timestamp', () => {
    const { result } = renderHook(() =>
      useChartScrub({
        tokensData: [{ timestamp: 2, value: 60 }],
        poolsData: [{ timestamp: 2, value: 0 }],
        earnData: [{ timestamp: 2, value: 15 }],
      }),
    )

    act(() => {
      result.current.handleScrub({ timestamp: 2, value: 75 })
    })
    act(() => {
      pendingAnimationFrame?.(0)
    })

    expect(result.current.chartScrubFiatValue).toBe(75)
    expect(result.current.chartScrubTokensValue).toBe(60)
    expect(result.current.chartScrubPoolsValue).toBe(0)
    expect(result.current.chartScrubEarnValue).toBe(15)
  })
})
