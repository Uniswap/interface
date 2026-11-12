import {
  UniswapHookProvenance,
  type useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { getHookProvenance, type HookProvenance } from '~/features/Hooks/getHookProvenance'
import { type Hook, type HookDeployment, HookRoutingStatus, HookSourceVerification } from '~/features/Hooks/types'

export interface HookListStatus extends HookProvenance {
  sourceVerified: boolean
  routingStatus: HookRoutingStatus
}

export function getHookListStatus({
  deployments,
  isFixture,
  getTrustedProvenance,
}: {
  deployments: Hook['deployments']
  isFixture: boolean
  getTrustedProvenance: ReturnType<typeof useUniswapHookProvenance>
}): HookListStatus {
  const resolveProvenance = (deployment: HookDeployment): HookProvenance =>
    getHookProvenance({ deployment, isFixture, getTrustedProvenance })
  const first = resolveProvenance(deployments[0])
  const rest = deployments.slice(1).map(resolveProvenance)
  const sharedProvenance =
    first.provenance !== undefined &&
    rest.every(
      (entry) =>
        entry.provenance === first.provenance &&
        (first.provenance !== UniswapHookProvenance.Built || entry.configurerName === first.configurerName) &&
        (first.provenance !== UniswapHookProvenance.Configured || entry.builderName === first.builderName),
    )
      ? first
      : undefined

  return {
    sourceVerified: deployments.every(
      (deployment) => deployment.sourceVerification === HookSourceVerification.Verified,
    ),
    routingStatus: deployments.some((deployment) => deployment.routingStatus === HookRoutingStatus.Supported)
      ? HookRoutingStatus.Supported
      : HookRoutingStatus.Unknown,
    provenance: sharedProvenance?.provenance,
    builderName: sharedProvenance?.builderName,
    configurerName: sharedProvenance?.configurerName,
  }
}
