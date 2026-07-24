import { act, renderHook } from '@testing-library/react'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)

describe(useLogEarnSurfaceViewed, () => {
  beforeEach(() => {
    mockSendAnalyticsEvent.mockClear()
  })

  it('logs once when the earn surface becomes visible', () => {
    const { rerender } = renderHook(
      ({ isVisible }) =>
        useLogEarnSurfaceViewed({
          entryPoint: EarnEntryPoint.ExploreChip,
          isVisible,
          surface: EarnAnalyticsSurface.Web,
        }),
      { initialProps: { isVisible: false } },
    )

    act(() => rerender({ isVisible: true }))
    act(() => rerender({ isVisible: true }))

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(EarnEventName.EarnSurfaceViewed, {
      entry_point: 'explore_chip',
      surface: 'web',
    })

    act(() => rerender({ isVisible: false }))
    act(() => rerender({ isVisible: true }))

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })
})
