import type { GasFeeResult } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import { AcrossRoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/AcrossRoutingInfo'
import { PlanRoutingInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/ChainedRoutingInfo'
import { RouteDiagramInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteDiagramInfo'
import { useRouteDiagram } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/useRouteDiagram'
import { RoutingHopInfo } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RoutingHopInfo'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isChained } from 'uniswap/src/features/transactions/swap/utils/routing'

/**
 * Component that displays the routing information for a given trade for different routing types
 * as a row in the swap details. Component may also show tooltips or modals with more information.
 */
export function RoutingInfo({
  trade,
  chainId,
  gasFee,
}: {
  trade: Trade
  chainId: UniverseChainId
  gasFee: GasFeeResult
}): JSX.Element | null {
  const routeDiagram = useRouteDiagram(trade)

  if (isChained(trade)) {
    return <PlanRoutingInfo trade={trade} />
  }
  if (isBridge(trade)) {
    return <AcrossRoutingInfo />
  }
  if (routeDiagram) {
    return <RouteDiagramInfo trade={trade} gasFee={gasFee} {...routeDiagram} />
  }

  return <RoutingHopInfo trade={trade} chainId={chainId} gasFee={gasFee} />
}
