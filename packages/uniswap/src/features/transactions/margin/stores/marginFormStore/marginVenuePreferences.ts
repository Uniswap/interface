import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'

// The preference is an opt-OUT set, so the default is the empty one: no exclusions means the server
// routes over every venue the pair offers, and a venue added to the wire later is picked up without
// the client shipping a new list.
export function isDefaultMarginVenues({ excludedVenues }: { excludedVenues: MarginVenue[] }): boolean {
  return excludedVenues.length === 0
}

// The `open` allowlist: the pair's own venues minus the user's exclusions, deduped and sorted so the
// same preference always produces the same array — the quote's query key is built from it, and an
// unstable order would re-quote on every render.
export function deriveMarginVenues({
  pairVenues,
  excludedVenues,
}: {
  pairVenues: MarginVenue[]
  excludedVenues: MarginVenue[]
}): MarginVenue[] {
  const excluded = new Set(excludedVenues)
  return [...new Set(pairVenues)].filter((venue) => !excluded.has(venue)).sort()
}
