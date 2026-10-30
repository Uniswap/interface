import type { TFunction } from 'i18next'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'

/** Third-party and unknown launches have no method label. */
export function getLaunchMethodLabel({
  method,
  t,
}: {
  method: LaunchProvenanceMethod
  t: TFunction
}): string | undefined {
  const labels: Record<LaunchProvenanceMethod, string | undefined> = {
    [LaunchProvenanceMethod.CustomAuction]: t('toucan.launchMethod.custom'),
    [LaunchProvenanceMethod.CrowdLaunch]: t('toucan.launchMethod.crowd'),
    [LaunchProvenanceMethod.InstantLaunch]: t('toucan.launchMethod.instant'),
    [LaunchProvenanceMethod.ThirdParty]: undefined,
    [LaunchProvenanceMethod.Unknown]: undefined,
  }
  return labels[method]
}
