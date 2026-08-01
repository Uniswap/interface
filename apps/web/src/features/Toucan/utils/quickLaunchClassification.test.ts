import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { isQuickLaunchAuction, isQuickLaunchAuctionData } from '~/features/Toucan/utils/quickLaunchClassification'

function makeEnrichedAuction(auction: Pick<Auction, 'isQuickLaunch'> | undefined): EnrichedAuction {
  return { auction } as unknown as EnrichedAuction
}

describe('isQuickLaunchAuctionData', () => {
  it('reads the typed backend is_quick_launch marker', () => {
    expect(isQuickLaunchAuctionData({ isQuickLaunch: true })).toBe(true)
    expect(isQuickLaunchAuctionData({ isQuickLaunch: false })).toBe(false)
  })

  it('treats a missing/pre-marker field as not a quick launch', () => {
    // Wire data can reach us without the field (unchecked casts / pre-marker auctions); the `?.`
    // + `=== true` keeps that false even though the generated type declares the field non-optional.
    expect(isQuickLaunchAuctionData({} as Pick<Auction, 'isQuickLaunch'>)).toBe(false)
  })

  it('returns false when there is no auction data', () => {
    expect(isQuickLaunchAuctionData(undefined)).toBe(false)
    expect(isQuickLaunchAuctionData(null)).toBe(false)
  })
})

describe('isQuickLaunchAuction', () => {
  it('reads the backend marker off the enriched auction message', () => {
    expect(isQuickLaunchAuction(makeEnrichedAuction({ isQuickLaunch: true }))).toBe(true)
    expect(isQuickLaunchAuction(makeEnrichedAuction({ isQuickLaunch: false }))).toBe(false)
  })

  it('returns false when there is no auction data', () => {
    expect(isQuickLaunchAuction(makeEnrichedAuction(undefined))).toBe(false)
  })
})
