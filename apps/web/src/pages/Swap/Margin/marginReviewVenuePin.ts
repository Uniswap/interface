// The review modal's venue pin, kept pure so the hold/adopt decision is unit-testable away from the
// modal.
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'

export interface MarginReviewVenuePin {
  // True while a poll has re-routed the open away from the venue the modal opened on: the figures
  // stay held at the pinned venue and Confirm is closed until the user adopts.
  held: boolean
  // The venue the adoption bar offers. Present iff `held`.
  adoptVenue?: MarginVenue
}

const NOT_HELD: MarginReviewVenuePin = { held: false }

// Venue selection is amount- and leverage-aware and re-runs on every poll, so the quote under an open
// review modal can change venue without the user touching anything. Swapping the figures in place
// would let someone confirm a route they never reviewed, so the modal holds instead.
//
// Fails OPEN in both unknown directions on purpose: with nothing pinned there is no reviewed route to
// protect, and with no quoted venue there is nothing to name in the bar — the modal's own quote and
// error gates already close Confirm in that window.
export function resolveReviewVenuePin({
  pinnedVenue,
  quotedVenue,
}: {
  pinnedVenue?: MarginVenue
  quotedVenue?: MarginVenue
}): MarginReviewVenuePin {
  if (!pinnedVenue || !quotedVenue || pinnedVenue === quotedVenue) {
    return NOT_HELD
  }
  return { held: true, adoptVenue: quotedVenue }
}
