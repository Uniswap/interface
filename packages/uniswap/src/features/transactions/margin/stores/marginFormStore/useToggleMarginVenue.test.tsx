import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { createMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import { useToggleMarginVenue } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useToggleMarginVenue'

const { mockSendAnalyticsEvent } = vi.hoisted(() => ({ mockSendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: mockSendAnalyticsEvent }))

function renderToggle(): {
  toggle: (params: { venue: 'MORPHO' | 'AAVE_V3' | 'AAVE_V4' }) => void
  store: ReturnType<typeof createMarginFormStore>
} {
  const store = createMarginFormStore({ initialState: {} })
  const { result } = renderHook(() => useToggleMarginVenue(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <MarginFormStoreContext.Provider value={store}>{children}</MarginFormStoreContext.Provider>
    ),
  })
  return { toggle: (params) => result.current(params), store }
}

describe('useToggleMarginVenue', () => {
  beforeEach(() => {
    mockSendAnalyticsEvent.mockReset()
  })

  it('excludes a venue and reports the resulting preference', () => {
    const { toggle, store } = renderToggle()
    toggle({ venue: 'MORPHO' })
    expect(store.getState().excludedVenues).toEqual(['MORPHO'])
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.MarginVenuePreferenceToggled, {
      venue: 'MORPHO',
      excluded: true,
      excludedCount: 1,
      isDefault: false,
    })
  })

  // The event describes the state the toggle LANDS in, not the one it left — a re-include has to
  // report the shrunken set, and returning to zero exclusions is the default again.
  it('re-includes a venue and reports the default state', () => {
    const { toggle, store } = renderToggle()
    toggle({ venue: 'MORPHO' })
    mockSendAnalyticsEvent.mockReset()
    toggle({ venue: 'MORPHO' })
    expect(store.getState().excludedVenues).toEqual([])
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.MarginVenuePreferenceToggled, {
      venue: 'MORPHO',
      excluded: false,
      excludedCount: 0,
      isDefault: true,
    })
  })
})
