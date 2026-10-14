import { Auction, AuctionType } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import {
  getAuctionLaunchMethod,
  getLaunchProvenanceFromAuction,
  isCcaAuction,
} from '~/features/Toucan/Auction/utils/auctionLaunchMethod'

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'

describe('getAuctionLaunchMethod', () => {
  it.each([
    [AuctionType.CUSTOM, LaunchProvenanceMethod.CustomAuction],
    [AuctionType.CROWD, LaunchProvenanceMethod.CrowdLaunch],
    [AuctionType.UNSPECIFIED, LaunchProvenanceMethod.Unknown],
  ])('uses the served auction type %s', (auctionType, expected) => {
    const auction = new Auction({ auctionType })
    expect(getAuctionLaunchMethod({ auction })).toBe(expected)
    expect(getLaunchProvenanceFromAuction({ auction }).method).toBe(expected)
  })
})

describe('isCcaAuction', () => {
  it.each([
    [AuctionType.CUSTOM, true],
    [AuctionType.CROWD, true],
    [AuctionType.UNSPECIFIED, false],
  ])('classifies auction type %s as CCA: %s', (auctionType, expected) => {
    expect(isCcaAuction({ auction: new Auction({ auctionType }) })).toBe(expected)
  })
})

describe('getLaunchProvenanceFromAuction', () => {
  it.each([false, true])('keeps the auction method unknown with isQuickLaunch=%s', (isQuickLaunch) => {
    const auction = new Auction({ isQuickLaunch, createdAt: '2026-08-08T12:00:00Z', address: AUCTION_ADDRESS })

    expect(getLaunchProvenanceFromAuction({ auction })).toEqual({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap' },
      method: LaunchProvenanceMethod.Unknown,
      launchedAt: new Date('2026-08-08T12:00:00Z'),
      auctionAddress: AUCTION_ADDRESS,
    })
  })

  it('leaves the launch time and address unknown when the record is incomplete', () => {
    const provenance = getLaunchProvenanceFromAuction({
      auction: new Auction({ createdAt: 'not-a-date', address: '' }),
    })

    expect(provenance.launchedAt).toBeUndefined()
    expect(provenance.auctionAddress).toBeUndefined()
  })
})
