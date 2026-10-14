import type { TFunction } from 'i18next'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { POOLS_BASE_URL } from '~/features/Toucan/utils/quickLaunchLinks'

interface LaunchMethodCopy {
  label: string
  explainerTitle: string
  explainerDescription: string
  learnMoreUrl: string
}

/**
 * Row label and explainer copy for the methods a user can drill into, kept together so surfaces
 * can't drift. Third-party and unknown launches have no method row (and no explainer), so they
 * resolve to undefined.
 */
export function getLaunchMethodCopy({
  method,
  t,
}: {
  method: LaunchProvenanceMethod
  t: TFunction
}): LaunchMethodCopy | undefined {
  const copyByMethod: Record<LaunchProvenanceMethod, LaunchMethodCopy | undefined> = {
    [LaunchProvenanceMethod.CustomAuction]: {
      label: t('toucan.launchMethod.custom'),
      explainerTitle: t('toucan.launchMethod.custom.title'),
      explainerDescription: t('toucan.launchMethod.custom.description'),
      learnMoreUrl: UniswapHelpUrls.articles.toucanIntro,
    },
    [LaunchProvenanceMethod.CrowdLaunch]: {
      label: t('toucan.launchMethod.crowd'),
      explainerTitle: t('toucan.launchMethod.crowd.title'),
      explainerDescription: t('toucan.launchMethod.crowd.description'),
      // TODO(CONS-3535): Replace with the Crowd Launch help article.
      learnMoreUrl: POOLS_BASE_URL,
    },
    [LaunchProvenanceMethod.InstantLaunch]: {
      label: t('toucan.launchMethod.instant'),
      explainerTitle: t('toucan.launchMethod.instant.title'),
      explainerDescription: t('toucan.launchMethod.instant.description'),
      // TODO(CONS-3535): Replace with the Instant Launch help article.
      learnMoreUrl: POOLS_BASE_URL,
    },
    [LaunchProvenanceMethod.ThirdParty]: undefined,
    [LaunchProvenanceMethod.Unknown]: undefined,
  }

  return copyByMethod[method]
}
