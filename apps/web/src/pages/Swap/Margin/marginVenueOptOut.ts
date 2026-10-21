// Row model for the per-venue opt-out sheet, kept pure so the last-enabled guard is unit-testable
// away from the modal.
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import type { MarginPair } from '~/constants/margin'

export interface MarginVenueOptOutRow {
  pair: MarginPair
  isEnabled: boolean
  // The last enabled venue of THIS pair can't be switched off from the rows: an empty allowlist is
  // not a request the wire accepts, so the rows would otherwise be a way to disable the market from
  // inside the sheet meant to configure it. The master "Default" switch is the way back to all-on.
  cantDisable: boolean
}

// One row per venue backing the pair, in the group's own (cheapest-rate-first) order. `excludedVenues`
// is the global preference, so a venue this pair doesn't offer simply never produces a row.
export function buildMarginVenueOptOutRows({
  pairs,
  excludedVenues,
}: {
  pairs: readonly MarginPair[]
  excludedVenues: readonly MarginVenue[]
}): MarginVenueOptOutRow[] {
  const excluded = new Set(excludedVenues)
  // Distinct enabled VENUES, not rows: deriveMarginVenues dedupes the wire's venue list, so were a pair
  // ever to carry two rows for one venue, counting rows would miss the last-enabled lock and one toggle
  // could zero the allowlist.
  const enabledCount = new Set(pairs.filter((pair) => !excluded.has(pair.venue)).map((pair) => pair.venue)).size
  return pairs.map((pair) => {
    const isEnabled = !excluded.has(pair.venue)
    return { pair, isEnabled, cantDisable: isEnabled && enabledCount === 1 }
  })
}
