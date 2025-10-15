import { useMemo } from 'react'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { jupiterRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingProviders/jupiterRoutingProvider'
import { uniswapRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingProviders/uniswapRoutingProvider'
import type { RoutingDiagramEntry, RoutingProvider } from 'uniswap/src/utils/routingDiagram/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * The routing provider map tells us how to render the routing diagram for a given routing type.
 * For routing types that do not render a routing diagram, it should be set to `undefined`.
 */
const ROUTING_PROVIDER_MAP: Record<Routing, RoutingProvider | undefined> = {
  [Routing.CLASSIC]: uniswapRoutingProvider,
  [Routing.JUPITER]: jupiterRoutingProvider,
  [Routing.DUTCH_V2]: undefined,
  [Routing.DUTCH_V3]: undefined,
  [Routing.DUTCH_LIMIT]: undefined,
  [Routing.BRIDGE]: undefined,
  [Routing.LIMIT_ORDER]: undefined,
  [Routing.PRIORITY]: undefined,
  [Routing.WRAP]: undefined,
  [Routing.UNWRAP]: undefined,
} as const

export function getRoutingProvider(routing: Routing): RoutingProvider | undefined {
  return ROUTING_PROVIDER_MAP[routing]
}

export function useRoutingProvider({ routing }: { routing?: Routing }): RoutingProvider | undefined {
  return useMemo(() => (routing ? getRoutingProvider(routing) : undefined), [routing])
}

export function getRoutingEntries(trade: Trade): RoutingDiagramEntry[] {
  const provider = getRoutingProvider(trade.routing)

  if (!provider) {
    return []
  }

  try {
    return provider.getRoutingEntries(trade)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'registry', function: 'getRoutingEntries' },
      extra: { routing: trade.routing },
    })
    return []
  }
}

export function useRoutingEntries({ trade }: { trade?: Trade }): RoutingDiagramEntry[] | undefined {
  return useMemo(() => (trade ? getRoutingEntries(trade) : undefined), [trade])
}
