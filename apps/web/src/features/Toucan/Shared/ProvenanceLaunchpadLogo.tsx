import { UniswapLogo } from '@universe/mycelium/icons/UniswapLogo'
import type { LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { resolveLaunchIpfsImageUrl } from '~/pages/Launches/data/resolveLaunchIpfsImageUrl'
import { UNISWAP_CCA_LAUNCHPAD_ID } from '~/pages/Launches/launchesModel'
import { LaunchpadLogo } from '~/pages/Launches/LaunchpadLogo'

/** A supplied registry logo wins; only the Uniswap CCA launchpad falls back to the Uniswap mark. */
export function ProvenanceLaunchpadLogo({
  launchpad,
  size,
}: {
  launchpad: LaunchProvenance['launchpad']
  size: number
}): JSX.Element {
  if (!launchpad.logoUrl && launchpad.id === UNISWAP_CCA_LAUNCHPAD_ID) {
    return <UniswapLogo size={size} color="$accent1" />
  }
  return <LaunchpadLogo url={resolveLaunchIpfsImageUrl(launchpad.logoUrl)} name={launchpad.name} size={size} />
}
