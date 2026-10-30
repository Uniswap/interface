import { Timestamp } from '@bufbuild/protobuf'
import { LaunchMethod, TokenLaunchProvenance } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { Auction, AuctionType } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import {
  getAuctionLaunchMethod,
  isAuctionLaunchMethod,
  isPoolsLaunchMethod,
  LaunchProvenanceMethod,
  toLaunchProvenance,
} from 'uniswap/src/features/dataApi/launchProvenance'

describe('isPoolsLaunchMethod', () => {
  it.each([LaunchProvenanceMethod.CrowdLaunch, LaunchProvenanceMethod.InstantLaunch])('is true for %s', (method) => {
    expect(isPoolsLaunchMethod(method)).toBe(true)
  })

  it.each([LaunchProvenanceMethod.CustomAuction, LaunchProvenanceMethod.ThirdParty, LaunchProvenanceMethod.Unknown])(
    'is false for %s',
    (method) => {
      expect(isPoolsLaunchMethod(method)).toBe(false)
    },
  )
})

describe('isAuctionLaunchMethod', () => {
  it.each([LaunchProvenanceMethod.CustomAuction, LaunchProvenanceMethod.CrowdLaunch])('is true for %s', (method) => {
    expect(isAuctionLaunchMethod(method)).toBe(true)
  })

  it.each([LaunchProvenanceMethod.InstantLaunch, LaunchProvenanceMethod.ThirdParty, LaunchProvenanceMethod.Unknown])(
    'is false for %s',
    (method) => {
      expect(isAuctionLaunchMethod(method)).toBe(false)
    },
  )

  it('is false while nothing has been attributed', () => {
    expect(isAuctionLaunchMethod(undefined)).toBe(false)
  })
})

describe('getAuctionLaunchMethod', () => {
  it.each([
    [AuctionType.CUSTOM, LaunchProvenanceMethod.CustomAuction],
    [AuctionType.CROWD, LaunchProvenanceMethod.CrowdLaunch],
    [AuctionType.UNSPECIFIED, LaunchProvenanceMethod.Unknown],
  ])('uses the served auction type %s', (auctionType, expected) => {
    expect(getAuctionLaunchMethod({ auction: new Auction({ auctionType }) })).toBe(expected)
  })

  it.each([false, true])('keeps an unclassified auction unknown with isQuickLaunch=%s', (isQuickLaunch) => {
    expect(getAuctionLaunchMethod({ auction: new Auction({ isQuickLaunch }) })).toBe(LaunchProvenanceMethod.Unknown)
  })
})

describe('toLaunchProvenance', () => {
  it.each([
    [LaunchMethod.CUSTOM, LaunchProvenanceMethod.CustomAuction],
    [LaunchMethod.CROWD, LaunchProvenanceMethod.CrowdLaunch],
    [LaunchMethod.INSTANT, LaunchProvenanceMethod.InstantLaunch],
    // A launchpad the registry names without recording how it launches is still an attribution.
    [LaunchMethod.UNSPECIFIED, LaunchProvenanceMethod.ThirdParty],
  ])('normalizes launch method %s', (launchMethod, expected) => {
    const provenance = new TokenLaunchProvenance({ launchMethod, launchpad: { id: 'pons', name: 'Pons' } })

    expect(toLaunchProvenance({ provenance })).toEqual({
      launchpad: { id: 'pons', name: 'Pons', logoUrl: undefined },
      method: expected,
    })
  })

  it.each([
    ['served', Timestamp.fromDate(new Date('2026-09-01T12:00:00Z')), new Date('2026-09-01T12:00:00Z')],
    ['unset', undefined, undefined],
    ['zero', { seconds: BigInt(0), nanos: 0 }, undefined],
  ])('reads a %s first trade', (_name, firstTradedAt, expected) => {
    const provenance = new TokenLaunchProvenance({
      launchMethod: LaunchMethod.CUSTOM,
      launchpad: { id: 'uniswap-cca' },
    })

    expect(toLaunchProvenance({ provenance, firstTradedAt })?.firstTradedAt).toEqual(expected)
  })

  it('falls back for a launch method this client does not know', () => {
    // The map is exhaustive over the generated enum, so only a newer wire value reaches the fallback.
    const provenance = new TokenLaunchProvenance({ launchMethod: 99 as LaunchMethod, launchpad: { id: 'pons' } })

    expect(toLaunchProvenance({ provenance })?.method).toBe(LaunchProvenanceMethod.ThirdParty)
  })

  it('names an unnamed launchpad after its registry id', () => {
    const provenance = new TokenLaunchProvenance({ launchpad: { id: 'pons' } })

    expect(toLaunchProvenance({ provenance })?.launchpad.name).toBe('pons')
  })

  it.each([
    ['nothing served', undefined],
    ['no launchpad', new TokenLaunchProvenance({ launchMethod: LaunchMethod.INSTANT })],
    ['an unidentified launchpad', new TokenLaunchProvenance({ launchpad: { name: 'Pons' } })],
  ])('attributes nothing given %s', (_name, provenance) => {
    expect(toLaunchProvenance({ provenance })).toBeUndefined()
  })
})
