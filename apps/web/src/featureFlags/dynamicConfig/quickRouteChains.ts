import { ChainId } from '@taraswap/sdk-core'
import { DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfig } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'

export const QUICK_ROUTE_CONFIG_KEY = 'quick_route_chains'

export function useQuickRouteChains(): ChainId[] {
  const statsigConfig = useDynamicConfig(DynamicConfigs.QuickRouteChains)
  const chains = statsigConfig.get(QUICK_ROUTE_CONFIG_KEY, []) as ChainId[]
  if (chains.every((c) => Object.values(ChainId).includes(c))) {
    return chains
  } else {
    logger.error(new Error('dynamic config chains contain invalid ChainId'), {
      tags: {
        file: 'quickRouteChains',
        function: 'useQuickRouteChains',
      },
      extra: {
        chains,
      },
    })
    return []
  }
}
