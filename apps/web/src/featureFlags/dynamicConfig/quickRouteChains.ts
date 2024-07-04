import { DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfig } from 'uniswap/src/features/gating/hooks'
import { InterfaceChainId, WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'

export const QUICK_ROUTE_CONFIG_KEY = 'quick_route_chains'

export function useQuickRouteChains(): InterfaceChainId[] {
  const statsigConfig = useDynamicConfig(DynamicConfigs.QuickRouteChains)
  const chains = statsigConfig.get(QUICK_ROUTE_CONFIG_KEY, []) as InterfaceChainId[]
  if (chains.every((c) => WEB_SUPPORTED_CHAIN_IDS.includes(c))) {
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
