import { deriveMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import type { MarginPair, MarginTokenInfo } from '~/constants/margin'
import { buildMarginVenueOptOutRows } from '~/pages/Swap/Margin/marginVenueOptOut'

const USDC: MarginTokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}

function pair(venue: MarginVenue): MarginPair {
  return { key: `weth-usdc-${venue}`, debt: USDC, venue, lltvWad: '860000000000000000', maxLeverage: 3 }
}

const THREE_VENUES = [pair('MORPHO'), pair('AAVE_V3'), pair('AAVE_V4')]

describe('buildMarginVenueOptOutRows', () => {
  it('enables every venue when nothing is excluded', () => {
    const rows = buildMarginVenueOptOutRows({ pairs: THREE_VENUES, excludedVenues: [] })
    expect(rows.map((row) => [row.pair.venue, row.isEnabled])).toEqual([
      ['MORPHO', true],
      ['AAVE_V3', true],
      ['AAVE_V4', true],
    ])
    expect(rows.every((row) => !row.cantDisable)).toBe(true)
  })

  it('reads an exclusion off the global preference', () => {
    const rows = buildMarginVenueOptOutRows({ pairs: THREE_VENUES, excludedVenues: ['AAVE_V3'] })
    expect(rows.map((row) => [row.pair.venue, row.isEnabled])).toEqual([
      ['MORPHO', true],
      ['AAVE_V3', false],
      ['AAVE_V4', true],
    ])
  })

  // The guard is what keeps the rows from producing a pair the wire can't quote.
  it('locks the last enabled venue and only that one', () => {
    const rows = buildMarginVenueOptOutRows({ pairs: THREE_VENUES, excludedVenues: ['AAVE_V3', 'AAVE_V4'] })
    expect(rows.map((row) => [row.pair.venue, row.cantDisable])).toEqual([
      ['MORPHO', true],
      ['AAVE_V3', false],
      ['AAVE_V4', false],
    ])
  })

  // Reachable without ever touching this pair's rows: the preference is global, so excluding a venue
  // on a pair that has three can empty a pair that only offers one of them.
  it('locks nothing when every venue is already excluded', () => {
    const rows = buildMarginVenueOptOutRows({
      pairs: [pair('MORPHO')],
      excludedVenues: ['MORPHO', 'AAVE_V3'],
    })
    expect(rows).toEqual([expect.objectContaining({ isEnabled: false, cantDisable: false })])
  })

  // An exclusion the pair doesn't offer must not count against it — otherwise the sole venue of a
  // one-venue pair would look like it had company and lose its lock.
  it('ignores an exclusion naming a venue this pair does not offer', () => {
    const rows = buildMarginVenueOptOutRows({ pairs: [pair('MORPHO')], excludedVenues: ['AAVE_V4'] })
    expect(rows).toEqual([expect.objectContaining({ isEnabled: true, cantDisable: true })])
  })

  // Distinct venues, not rows: were a pair ever to carry two rows for one venue (deriveMarginVenues
  // dedupes for that shape), counting rows would read two enabled and lock nothing, so one toggle could
  // zero the allowlist. Counting distinct venues keeps the single real venue locked.
  it('counts distinct venues, so a duplicated venue still locks as the last enabled', () => {
    const rows = buildMarginVenueOptOutRows({ pairs: [pair('MORPHO'), pair('MORPHO')], excludedVenues: [] })
    expect(rows.map((row) => row.cantDisable)).toEqual([true, true])
  })

  // The rows and the request are two views of one preference: what a row shows as enabled is exactly
  // what deriveMarginVenues sends as `open.venues`.
  it('agrees with the allowlist the quote is asked with', () => {
    const excludedVenues: MarginVenue[] = ['AAVE_V3']
    const rows = buildMarginVenueOptOutRows({ pairs: THREE_VENUES, excludedVenues })
    const enabled = rows.filter((row) => row.isEnabled).map((row) => row.pair.venue)
    expect([...enabled].sort()).toEqual(
      deriveMarginVenues({ pairVenues: THREE_VENUES.map((p) => p.venue), excludedVenues }),
    )
  })
})
