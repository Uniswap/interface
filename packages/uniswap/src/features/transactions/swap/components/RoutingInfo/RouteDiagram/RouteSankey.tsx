import type { UniverseChainId } from '@universe/chains'
import type { RouteDiagram } from 'uniswap/src/utils/routingDiagram/routeGraph/buildRouteDiagram'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface RouteSankeyProps {
  diagram: RouteDiagram
  chainId: UniverseChainId
  /** Maximum chart height in px (routes with little flow render shorter); the width follows the container. */
  height: number
  /** Diameter of the token logo centred on each node bar. */
  iconSize: number
  logoUrlByTokenKey: ReadonlyMap<string, string>
  /** Called after a same-tab navigation so the host can close its modal. */
  onNavigate?: () => void
}

export function RouteSankey(_props: RouteSankeyProps): JSX.Element | null {
  throw new PlatformSplitStubError('RouteSankey')
}
