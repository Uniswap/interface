import {
  UniswapHookProvenance,
  type useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import type { HookDeployment } from '~/features/Hooks/types'

export interface HookProvenance {
  provenance: UniswapHookProvenance | undefined
  builderName: string | undefined
  configurerName: string | undefined
}

export function getHookProvenance({
  deployment,
  isFixture,
  getTrustedProvenance,
}: {
  deployment: HookDeployment
  isFixture: boolean
  getTrustedProvenance: ReturnType<typeof useUniswapHookProvenance>
}): HookProvenance {
  if (isFixture && deployment.isFixture) {
    const fixture = deployment.fixtureProvenance
    const partnerName = fixture?.partnerName?.trim() || undefined
    return {
      provenance: fixture?.kind,
      builderName: fixture?.kind === UniswapHookProvenance.Configured ? partnerName : undefined,
      configurerName: fixture?.kind === UniswapHookProvenance.Built ? partnerName : undefined,
    }
  }

  return {
    provenance: getTrustedProvenance({
      chainId: deployment.chainId,
      address: deployment.address,
    }),
    builderName: deployment.provenance.builder?.name.trim() || undefined,
    configurerName: deployment.provenance.configurer?.name.trim() || undefined,
  }
}
