import { Auction, AuctionType } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { LaunchProvenanceMethod, type LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import {
  getAuctionLaunchMethod,
  getLaunchProvenanceFromAuction,
  isCcaAuction,
  mergeLaunchProvenance,
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
  it.each([
    [AuctionType.CUSTOM, { id: 'uniswap-cca', name: 'Uniswap' }],
    [AuctionType.CROWD, { id: 'pools', name: 'pools.xyz', url: 'https://pools.xyz' }],
    [AuctionType.UNSPECIFIED, { id: 'uniswap-cca', name: 'Uniswap' }],
  ])('attributes auction type %s to its launchpad', (auctionType, launchpad) => {
    expect(getLaunchProvenanceFromAuction({ auction: new Auction({ auctionType }) }).launchpad).toEqual(launchpad)
  })

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

describe('mergeLaunchProvenance', () => {
  const PONS: LaunchProvenance = {
    launchpad: { id: 'pons', name: 'Pons', logoUrl: 'https://example.com/pons.png', url: 'https://pons.example' },
    method: LaunchProvenanceMethod.ThirdParty,
  }

  it('attributes nothing when neither source does', () => {
    expect(mergeLaunchProvenance({ served: undefined, auction: undefined })).toBeUndefined()
  })

  it('falls back to the auction while the token is unattributed', () => {
    const auction = new Auction({ auctionType: AuctionType.CUSTOM, address: AUCTION_ADDRESS })

    expect(mergeLaunchProvenance({ served: undefined, auction })).toEqual(getLaunchProvenanceFromAuction({ auction }))
  })

  it('attributes a launch the page found no auction for', () => {
    expect(mergeLaunchProvenance({ served: PONS, auction: undefined })).toEqual(PONS)
  })

  // The registry serves our own launches under a mechanism name and one shared logo.
  it.each([
    [
      'crowd launch',
      { id: 'uniswap-cca', name: 'Uniswap CCA Crowd Launch', logoUrl: 'ipfs://registry' },
      LaunchProvenanceMethod.CrowdLaunch,
      { id: 'pools', name: 'pools.xyz', url: 'https://pools.xyz' },
    ],
    [
      'instant launch',
      { id: 'uniswap-bonding-curve', name: 'Uniswap Instant Launch', logoUrl: 'ipfs://registry' },
      LaunchProvenanceMethod.InstantLaunch,
      { id: 'pools', name: 'pools.xyz', url: 'https://pools.xyz' },
    ],
    [
      'custom auction',
      { id: 'uniswap-cca', name: 'Uniswap CCA Custom Launch', logoUrl: 'ipfs://registry' },
      LaunchProvenanceMethod.CustomAuction,
      { id: 'uniswap-cca', name: 'Uniswap' },
    ],
  ])('replaces the registry entry for a served %s', (_name, launchpad, method, expected) => {
    expect(mergeLaunchProvenance({ served: { launchpad, method }, auction: undefined })?.launchpad).toEqual(expected)
  })

  it('keeps the served launchpad while the auction classifies the mechanism and the launch time', () => {
    const auction = new Auction({
      auctionType: AuctionType.CROWD,
      address: AUCTION_ADDRESS,
      createdAt: '2026-08-08T12:00:00Z',
    })

    expect(mergeLaunchProvenance({ served: PONS, auction })).toEqual({
      launchpad: { ...PONS.launchpad },
      method: LaunchProvenanceMethod.CrowdLaunch,
      launchedAt: new Date('2026-08-08T12:00:00Z'),
      auctionAddress: AUCTION_ADDRESS,
    })
  })

  it('adds nothing to an auction the registry attributes to us as well', () => {
    const served = {
      launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA Custom Launch', logoUrl: 'ipfs://registry' },
      method: LaunchProvenanceMethod.CustomAuction,
    }
    const auction = new Auction({ auctionType: AuctionType.CUSTOM, address: AUCTION_ADDRESS })

    expect(mergeLaunchProvenance({ served, auction })).toEqual(getLaunchProvenanceFromAuction({ auction }))
  })

  it('classifies an unclassified auction by the served method', () => {
    const auction = new Auction({ auctionType: AuctionType.UNSPECIFIED })

    expect(mergeLaunchProvenance({ served: PONS, auction })?.method).toBe(LaunchProvenanceMethod.ThirdParty)
  })
})
