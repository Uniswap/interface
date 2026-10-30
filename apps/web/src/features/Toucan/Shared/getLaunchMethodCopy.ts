import type { TFunction } from 'i18next'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { getLaunchMethodLabel } from 'uniswap/src/features/toucan/launchMethodLabel'

interface LaunchMethodCopy {
  label: string
  explainerTitle: string
  explainerDescription: string
  learnMoreUrl: string
}

/**
 * Row label and explainer copy for the methods a user can drill into. Third-party and unknown
 * launches have no method row (and no explainer), so they resolve to undefined.
 */
export function getLaunchMethodCopy({
  method,
  t,
}: {
  method: LaunchProvenanceMethod
  t: TFunction
}): LaunchMethodCopy | undefined {
  const explainerByMethod: Record<LaunchProvenanceMethod, Omit<LaunchMethodCopy, 'label'> | undefined> = {
    [LaunchProvenanceMethod.CustomAuction]: {
      explainerTitle: t('toucan.launchMethod.custom.title'),
      explainerDescription: t('toucan.launchMethod.custom.description'),
      learnMoreUrl: UniswapHelpUrls.articles.toucanLaunchAuctionHelp,
    },
    [LaunchProvenanceMethod.CrowdLaunch]: {
      explainerTitle: t('toucan.launchMethod.crowd.title'),
      explainerDescription: t('toucan.launchMethod.crowd.description'),
      learnMoreUrl: UniswapHelpUrls.articles.toucanPoolsLaunchHelp,
    },
    [LaunchProvenanceMethod.InstantLaunch]: {
      explainerTitle: t('toucan.launchMethod.instant.title'),
      explainerDescription: t('toucan.launchMethod.instant.description'),
      learnMoreUrl: UniswapHelpUrls.articles.toucanPoolsLaunchHelp,
    },
    [LaunchProvenanceMethod.ThirdParty]: undefined,
    [LaunchProvenanceMethod.Unknown]: undefined,
  }

  const label = getLaunchMethodLabel({ method, t })
  const explainer = explainerByMethod[method]
  return label && explainer ? { label, ...explainer } : undefined
}
