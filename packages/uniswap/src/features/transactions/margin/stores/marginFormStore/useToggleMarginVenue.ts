import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isDefaultMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import { useMarginFormStoreBase } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'

// The opt-out sheet's toggle. Wraps the store action rather than instrumenting the store itself: the
// store is shared with tests and hydration, and neither should emit a user-preference event.
//
// Reads the exclusions off the store at call time, not through a selector: a render-captured set goes
// stale between two toggles in one tick and would report the landing state wrong (and subscribing
// would re-render every toggle host on any other venue's change).
export function useToggleMarginVenue(): (params: { venue: MarginVenue }) => void {
  const store = useMarginFormStoreBase()

  return useEvent(({ venue }: { venue: MarginVenue }): void => {
    store.getState().actions.toggleVenue(venue)
    const excludedVenues = store.getState().excludedVenues
    sendAnalyticsEvent(InterfaceEventName.MarginVenuePreferenceToggled, {
      venue,
      excluded: excludedVenues.includes(venue),
      excludedCount: excludedVenues.length,
      isDefault: isDefaultMarginVenues({ excludedVenues }),
    })
  })
}
