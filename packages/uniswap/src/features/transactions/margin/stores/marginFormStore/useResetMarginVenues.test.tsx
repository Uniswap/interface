import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { createMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import { useResetMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useResetMarginVenues'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'

const { mockSendAnalyticsEvent } = vi.hoisted(() => ({ mockSendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: mockSendAnalyticsEvent }))

function renderReset({ excludedVenues }: { excludedVenues: MarginVenue[] }): {
  reset: () => void
  store: ReturnType<typeof createMarginFormStore>
} {
  const store = createMarginFormStore({ initialState: { excludedVenues } })
  const { result } = renderHook(() => useResetMarginVenues(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <MarginFormStoreContext.Provider value={store}>{children}</MarginFormStoreContext.Provider>
    ),
  })
  return { reset: () => result.current(), store }
}

describe('useResetMarginVenues', () => {
  beforeEach(() => {
    mockSendAnalyticsEvent.mockReset()
  })

  it('clears every exclusion', () => {
    const { reset, store } = renderReset({ excludedVenues: ['MORPHO', 'AAVE_V4'] })
    reset()
    expect(store.getState().excludedVenues).toEqual([])
  })

  // One event per venue it re-includes, each carrying the landing state — the master switch is N
  // per-venue re-inclusions, so the funnel needs no second event shape to interpret.
  it('reports each re-included venue against the landing default', () => {
    const { reset } = renderReset({ excludedVenues: ['MORPHO', 'AAVE_V4'] })
    reset()
    expect(mockSendAnalyticsEvent.mock.calls).toEqual([
      [
        InterfaceEventName.MarginVenuePreferenceToggled,
        { venue: 'MORPHO', excluded: false, excludedCount: 0, isDefault: true },
      ],
      [
        InterfaceEventName.MarginVenuePreferenceToggled,
        { venue: 'AAVE_V4', excluded: false, excludedCount: 0, isDefault: true },
      ],
    ])
  })

  // The switch is already on in the default state, so pressing it there is not a preference change.
  it('reports nothing when the preference is already the default', () => {
    const { reset, store } = renderReset({ excludedVenues: [] })
    reset()
    expect(store.getState().excludedVenues).toEqual([])
    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
