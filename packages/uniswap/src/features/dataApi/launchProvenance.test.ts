import { isPoolsLaunchMethod, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'

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
