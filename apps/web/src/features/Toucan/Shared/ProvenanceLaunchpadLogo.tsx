import { UniswapLogo } from '@universe/mycelium/icons/UniswapLogo'
import { PoolsLogo } from 'ui/src/components/icons/PoolsLogo'
import type { LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { resolveIpfsGatewayUrl } from 'utilities/src/format/gatewayUrls'
import { usePoolsBrandGreen } from '~/hooks/usePoolsBrandGreen'
import { POOLS_LAUNCHPAD_GROUP_ID, UNISWAP_CCA_LAUNCHPAD_ID } from '~/pages/Launches/launchesModel'
import { LaunchpadLogo } from '~/pages/Launches/LaunchpadLogo'

/** A supplied registry logo wins; without one, only the Uniswap CCA and pools.xyz launchpads fall back to their marks. */
export function ProvenanceLaunchpadLogo({
  launchpad,
  size,
}: {
  launchpad: LaunchProvenance['launchpad']
  size: number
}): JSX.Element {
  const poolsBrandGreen = usePoolsBrandGreen()
  if (!launchpad.logoUrl) {
    if (launchpad.id === UNISWAP_CCA_LAUNCHPAD_ID) {
      return <UniswapLogo size={size} color="$accent1" />
    }
    if (launchpad.id === POOLS_LAUNCHPAD_GROUP_ID) {
      return <PoolsLogo size={size} color={poolsBrandGreen} />
    }
  }
  return <LaunchpadLogo url={resolveIpfsGatewayUrl(launchpad.logoUrl)} name={launchpad.name} size={size} />
}
