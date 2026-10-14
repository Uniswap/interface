import type { TFunction } from 'i18next'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { getLaunchMethodCopy } from '~/features/Toucan/Shared/getLaunchMethodCopy'

const t = ((key: string) => key) as unknown as TFunction

describe('getLaunchMethodCopy', () => {
  it('returns the Custom auction copy keys with the CCA help article', () => {
    expect(getLaunchMethodCopy({ method: LaunchProvenanceMethod.CustomAuction, t })).toEqual({
      label: 'toucan.launchMethod.custom',
      explainerTitle: 'toucan.launchMethod.custom.title',
      explainerDescription: 'toucan.launchMethod.custom.description',
      learnMoreUrl: UniswapHelpUrls.articles.toucanIntro,
    })
  })

  it('returns Crowd Launch copy with the temporary pools.xyz help link', () => {
    expect(getLaunchMethodCopy({ method: LaunchProvenanceMethod.CrowdLaunch, t })).toEqual({
      label: 'toucan.launchMethod.crowd',
      explainerTitle: 'toucan.launchMethod.crowd.title',
      explainerDescription: 'toucan.launchMethod.crowd.description',
      learnMoreUrl: 'https://pools.xyz',
    })
  })

  it('returns Instant Launch copy with the temporary pools.xyz help link', () => {
    expect(getLaunchMethodCopy({ method: LaunchProvenanceMethod.InstantLaunch, t })).toEqual({
      label: 'toucan.launchMethod.instant',
      explainerTitle: 'toucan.launchMethod.instant.title',
      explainerDescription: 'toucan.launchMethod.instant.description',
      learnMoreUrl: 'https://pools.xyz',
    })
  })

  it('has no copy for third-party or unknown launches', () => {
    expect(getLaunchMethodCopy({ method: LaunchProvenanceMethod.ThirdParty, t })).toBeUndefined()
    expect(getLaunchMethodCopy({ method: LaunchProvenanceMethod.Unknown, t })).toBeUndefined()
  })
})
