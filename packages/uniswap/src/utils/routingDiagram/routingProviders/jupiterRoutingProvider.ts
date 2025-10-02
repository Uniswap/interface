import { Percent } from '@uniswap/sdk-core'
import { JupiterLogoMonotone } from 'ui/src/components/logos/JupiterLogoMonotone'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { RoutingDiagramEntry, RoutingHop, RoutingProvider } from 'uniswap/src/utils/routingDiagram/types'

export const jupiterRoutingProvider: RoutingProvider = {
  name: 'Jupiter Ultra',
  icon: JupiterLogoMonotone,
  iconColor: '$neutral1',

  getRoutingEntries: (trade: Trade): RoutingDiagramEntry[] => {
    if (!isJupiter(trade)) {
      throw new Error(`Invalid call to jupiterProvider.getRoutingEntries with non-jupiter trade: ${trade.routing}`)
    }

    const { routePlan } = trade.quote.quote

    // Check if this is a sequential multi-hop route
    // Sequential routes have each hop's output matching the next hop's input
    const isSequential =
      routePlan.length > 1 &&
      routePlan.every((route, i) => i === 0 || route.swapInfo.inputMint === routePlan[i - 1]?.swapInfo.outputMint)

    if (isSequential) {
      // Multi-hop route: combine all hops into a single path
      const path: RoutingHop[] = routePlan.map((route) => ({
        type: 'genericHop' as const,
        inputCurrencyId: buildCurrencyId(UniverseChainId.Solana, route.swapInfo.inputMint),
        outputCurrencyId: buildCurrencyId(UniverseChainId.Solana, route.swapInfo.outputMint),
        name: route.swapInfo.label,
      }))

      return [
        {
          percent: new Percent(100, 100),
          path,
          protocolLabel: 'Jupiter',
        },
      ]
    } else {
      // Split routes: create separate entries for each route
      return routePlan.map((route) => ({
        percent: new Percent(route.percent, 100),
        path: [
          {
            type: 'genericHop' as const,
            inputCurrencyId: buildCurrencyId(UniverseChainId.Solana, route.swapInfo.inputMint),
            outputCurrencyId: buildCurrencyId(UniverseChainId.Solana, route.swapInfo.outputMint),
            name: route.swapInfo.label,
          },
        ],
        protocolLabel: 'Jupiter',
      }))
    }
  },

  getDescription: (t) => t('swap.routing.jupiter.description'),
}
