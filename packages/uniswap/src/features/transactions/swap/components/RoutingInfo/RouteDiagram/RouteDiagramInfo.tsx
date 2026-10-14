import type { GasFeeResult } from '@universe/api'
import type { RouteDiagramData } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/useRouteDiagram'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface RouteDiagramInfoProps extends RouteDiagramData {
  trade: Trade
  /** The swap's network cost, shown in the modal's subtitle like the Network cost row. */
  gasFee: GasFeeResult
}

/** The Route row with a View button that opens the route's Sankey diagram in a modal. */
export function RouteDiagramInfo(_props: RouteDiagramInfoProps): JSX.Element | null {
  throw new PlatformSplitStubError('RouteDiagramInfo')
}
