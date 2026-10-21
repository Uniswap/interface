import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useMarginFormStoreBase } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { useEvent } from 'utilities/src/react/hooks'

// The opt-out sheet's master "Default" switch: clears every exclusion. Wraps the store action for the
// same reason useToggleMarginVenue does — the store is shared with tests and hydration, and neither
// should emit a user-preference event.
//
// Reports one MarginVenuePreferenceToggled per venue it re-includes rather than inventing a
// whole-set event: the master switch is exactly N per-venue re-inclusions, and each carries the
// landing state (nothing excluded), so the funnel needs no second shape to interpret.
export function useResetMarginVenues(): () => void {
  const store = useMarginFormStoreBase()

  return useEvent((): void => {
    const reIncluded = store.getState().excludedVenues
    if (reIncluded.length === 0) {
      return
    }
    store.getState().actions.resetVenues()
    for (const venue of reIncluded) {
      sendAnalyticsEvent(InterfaceEventName.MarginVenuePreferenceToggled, {
        venue,
        excluded: false,
        excludedCount: 0,
        isDefault: true,
      })
    }
  })
}
