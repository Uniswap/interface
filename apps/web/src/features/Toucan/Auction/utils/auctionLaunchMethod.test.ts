import { LaunchMethod } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Auction, AuctionType } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import {
  LaunchProvenanceMethod,
  type LaunchProvenance,
  toLaunchProvenance,
} from 'uniswap/src/features/dataApi/launchProvenance'
import { isCcaAuction, mergeLaunchProvenance } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'

describe('isCcaAuction', () => {
  it.each([
    [AuctionType.CUSTOM, true],
    [AuctionType.CROWD, true],
    [AuctionType.UNSPECIFIED, false],
  ])('classifies auction type %s as CCA: %s', (auctionType, expected) => {
    expect(isCcaAuction({ auction: new Auction({ auctionType }) })).toBe(expected)
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

  it.each([AuctionType.CUSTOM, AuctionType.CROWD])('attributes nothing to an unserved %s auction', (auctionType) => {
    const auction = new Auction({ auctionType, address: AUCTION_ADDRESS })

    expect(mergeLaunchProvenance({ served: undefined, auction })).toBeUndefined()
  })

  it('attributes a launch the page found no auction for', () => {
    const served = { ...PONS, firstTradedAt: new Date('2026-09-01T12:00:00Z') }

    expect(mergeLaunchProvenance({ served, auction: undefined })).toEqual(served)
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

  it('keeps the served launchpad, method and first trade while the auction adds its address', () => {
    const firstTradedAt = new Date('2026-09-01T12:00:00Z')
    // The auction's own creation time is not a trade, so it never stands in for one.
    const auction = new Auction({
      auctionType: AuctionType.CROWD,
      address: AUCTION_ADDRESS,
      createdAt: '2026-08-08T12:00:00Z',
    })

    expect(mergeLaunchProvenance({ served: { ...PONS, firstTradedAt }, auction })).toEqual({
      ...PONS,
      firstTradedAt,
      auctionAddress: AUCTION_ADDRESS,
    })
  })

  it('keeps a served Crowd Launch on pools.xyz when the page selects a later Custom re-auction', () => {
    const served = {
      launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA Crowd Launch', logoUrl: 'ipfs://registry' },
      method: LaunchProvenanceMethod.CrowdLaunch,
    }
    const reauction = new Auction({ auctionType: AuctionType.CUSTOM, address: AUCTION_ADDRESS })

    expect(mergeLaunchProvenance({ served, auction: reauction })).toMatchObject({
      method: LaunchProvenanceMethod.CrowdLaunch,
      launchpad: { id: 'pools', name: 'pools.xyz', url: 'https://pools.xyz' },
    })
  })

  it.each([
    [AuctionType.CUSTOM, LaunchProvenanceMethod.CustomAuction, { id: 'uniswap-cca', name: 'Uniswap' }],
    [
      AuctionType.CROWD,
      LaunchProvenanceMethod.CrowdLaunch,
      { id: 'pools', name: 'pools.xyz', url: 'https://pools.xyz' },
    ],
  ])('classifies our own launch served without a method by its %s auction', (auctionType, method, launchpad) => {
    const served = toLaunchProvenance({
      provenance: {
        launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA', logoUrl: 'ipfs://registry' },
        launchMethod: LaunchMethod.UNSPECIFIED,
      },
    })

    expect(mergeLaunchProvenance({ served, auction: new Auction({ auctionType }) })).toMatchObject({
      method,
      launchpad,
    })
  })

  it('adds nothing to an auction the registry attributes to us as well', () => {
    const served = {
      launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA Custom Launch', logoUrl: 'ipfs://registry' },
      method: LaunchProvenanceMethod.CustomAuction,
    }
    const auction = new Auction({ auctionType: AuctionType.CUSTOM, address: AUCTION_ADDRESS })

    expect(mergeLaunchProvenance({ served, auction })).toEqual({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap' },
      method: LaunchProvenanceMethod.CustomAuction,
      auctionAddress: AUCTION_ADDRESS,
    })
  })

  it('leaves the address unknown when the auction record has none', () => {
    const auction = new Auction({ address: '' })

    expect(mergeLaunchProvenance({ served: PONS, auction })?.auctionAddress).toBeUndefined()
  })

  it.each([AuctionType.UNSPECIFIED, AuctionType.CROWD])(
    'keeps a third-party launchpad unclassified beside a %s auction',
    (auctionType) => {
      const auction = new Auction({ auctionType })

      expect(mergeLaunchProvenance({ served: PONS, auction })?.method).toBe(LaunchProvenanceMethod.ThirdParty)
    },
  )
})
