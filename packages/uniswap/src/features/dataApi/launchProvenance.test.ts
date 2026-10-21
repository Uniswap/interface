import { LaunchMethod, TokenLaunchProvenance } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import {
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
