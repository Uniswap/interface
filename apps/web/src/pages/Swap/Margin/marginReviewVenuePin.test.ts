import { describe, expect, it } from 'vitest'
import { resolveReviewVenuePin } from '~/pages/Swap/Margin/marginReviewVenuePin'

describe('resolveReviewVenuePin', () => {
  it('lets a poll on the pinned venue through', () => {
    expect(resolveReviewVenuePin({ pinnedVenue: 'MORPHO', quotedVenue: 'MORPHO' })).toEqual({ held: false })
  })

  it('holds and names the new venue when a poll re-routes', () => {
    expect(resolveReviewVenuePin({ pinnedVenue: 'MORPHO', quotedVenue: 'AAVE_V3' })).toEqual({
      held: true,
      adoptVenue: 'AAVE_V3',
    })
  })

  // Adopting re-pins to what the poll returned, which is the same-venue case one render later.
  it('releases the hold once the new venue is the pinned one', () => {
    const held = resolveReviewVenuePin({ pinnedVenue: 'MORPHO', quotedVenue: 'AAVE_V3' })
    expect(resolveReviewVenuePin({ pinnedVenue: held.adoptVenue, quotedVenue: 'AAVE_V3' })).toEqual({ held: false })
  })

  // Nothing pinned = no reviewed route to protect; holding here would strand a modal that never
  // showed a venue in the first place.
  it('does not hold with nothing pinned', () => {
    expect(resolveReviewVenuePin({ pinnedVenue: undefined, quotedVenue: 'AAVE_V3' })).toEqual({ held: false })
  })

  // A vanished quote is the existing quote/error gate's job — an adoption bar has no venue to name.
  it('does not hold when the quote carries no venue', () => {
    expect(resolveReviewVenuePin({ pinnedVenue: 'MORPHO', quotedVenue: undefined })).toEqual({ held: false })
  })

  it('never offers an adopt venue while unheld', () => {
    for (const pin of [
      resolveReviewVenuePin({ pinnedVenue: 'MORPHO', quotedVenue: 'MORPHO' }),
      resolveReviewVenuePin({ pinnedVenue: undefined, quotedVenue: 'MORPHO' }),
      resolveReviewVenuePin({ pinnedVenue: 'MORPHO', quotedVenue: undefined }),
    ]) {
      expect(pin.adoptVenue).toBeUndefined()
    }
  })

  it('treats the two Aave versions as different venues', () => {
    expect(resolveReviewVenuePin({ pinnedVenue: 'AAVE_V3', quotedVenue: 'AAVE_V4' })).toEqual({
      held: true,
      adoptVenue: 'AAVE_V4',
    })
  })
})
