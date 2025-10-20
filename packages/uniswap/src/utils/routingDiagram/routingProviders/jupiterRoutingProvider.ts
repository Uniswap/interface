import { Percent } from '@uniswap/sdk-core'
import { JupiterLogoMonotone } from 'ui/src/components/logos/JupiterLogoMonotone'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isJupiter } from 'uniswap/src/features/transactions/swap/utils/routing'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { RoutingDiagramEntry, RoutingHop, RoutingProvider } from 'uniswap/src/utils/routingDiagram/types'
import { logger } from 'utilities/src/logger/logger'

export const jupiterRoutingProvider: RoutingProvider = {
  name: 'Jupiter Ultra',
  icon: JupiterLogoMonotone,
  iconColor: '$neutral1',

  getRoutingEntries: (trade: Trade): RoutingDiagramEntry[] => {
    if (!isJupiter(trade)) {
      throw new Error(`Invalid call to jupiterProvider.getRoutingEntries with non-jupiter trade: ${trade.routing}`)
    }

    const { routePlan } = trade.quote.quote

    if (routePlan.length === 0) {
      return []
    }

    // Identify the original input token (from the first route)
    const originalInputMint = routePlan[0]?.swapInfo.inputMint
    if (!originalInputMint) {
      return []
    }

    // Build complete paths by following the token flow
    const paths: Array<{ hops: typeof routePlan; percent: number }> = []
    const processedIndices = new Set<number>()

    // Find all entry routes (routes that start from the original input)
    for (let i = 0; i < routePlan.length; i++) {
      if (processedIndices.has(i)) {
        continue
      }

      const route = routePlan[i]
      if (!route) {
        continue
      }

      // Check if this is an entry route (starts from original input)
      if (route.swapInfo.inputMint === originalInputMint) {
        const path: typeof routePlan = [route]
        const pathPercent = route.percent
        processedIndices.add(i)

        // Follow the chain of continuations
        let currentOutputMint = route.swapInfo.outputMint

        // Look for continuation routes (percent = 100 and inputMint matches currentOutputMint)
        for (let j = i + 1; j < routePlan.length; j++) {
          if (processedIndices.has(j)) {
            continue
          }

          const nextRoute = routePlan[j]
          if (!nextRoute) {
            continue
          }

          // Check if this is a continuation (100% processing of intermediate token)
          if (nextRoute.swapInfo.inputMint === currentOutputMint && nextRoute.percent === 100) {
            path.push(nextRoute)
            currentOutputMint = nextRoute.swapInfo.outputMint
            processedIndices.add(j)
            // Continue looking for more continuations in the chain
          }
        }

        paths.push({ hops: path, percent: pathPercent })
      }
    }

    // Handle edge case: if no entry routes found but we have a single route with 100%,
    // it means the entire swap is one path
    if (paths.length === 0 && routePlan.length > 0 && routePlan[0]?.percent === 100) {
      paths.push({ hops: routePlan, percent: 100 })
    }

    // Validate that percentages add up to 100%
    const totalPercent = paths.reduce((sum, path) => sum + path.percent, 0)
    if (totalPercent !== 100) {
      logger.error(new Error(`Jupiter route percentages do not add up to 100% (total: ${totalPercent}%)`), {
        tags: {
          file: 'jupiterRoutingProvider.ts',
          function: 'getRoutingEntries',
        },
        extra: {
          totalPercent,
          paths: paths.map((p) => ({
            percent: p.percent,
            hops: p.hops.length,
            route: `${p.hops[0]?.swapInfo.inputMint} → ${p.hops[p.hops.length - 1]?.swapInfo.outputMint}`,
          })),
          routePlan: routePlan.map((r) => ({
            percent: r.percent,
            route: `${r.swapInfo.inputMint} → ${r.swapInfo.outputMint}`,
            label: r.swapInfo.label,
          })),
        },
      })
    }

    // Convert paths to routing entries
    return paths.map(({ hops, percent }) => {
      const path: RoutingHop[] = hops.map((route) => ({
        type: 'genericHop' as const,
        inputCurrencyId: buildCurrencyId(UniverseChainId.Solana, route.swapInfo.inputMint),
        outputCurrencyId: buildCurrencyId(UniverseChainId.Solana, route.swapInfo.outputMint),
        name: route.swapInfo.label,
      }))

      return {
        percent: new Percent(percent, 100),
        path,
        protocolLabel: 'Jupiter',
      }
    })
  },

  getDescription: (t) => t('swap.routing.jupiter.description'),
}
